const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;

const BACKEND_PORT = 5000;
const isDev = !app.isPackaged;

function findEnvFile() {
  // Try multiple locations for the .env file
  const candidates = isDev
    ? [
        path.join(__dirname, '..', '.env'),
        path.join(__dirname, '.env')
      ]
    : [
        path.join(process.resourcesPath, '.env'),
        path.join(process.resourcesPath, '..', '.env'),
        path.join(path.dirname(process.execPath), '.env'),
        path.join(app.getPath('userData'), '.env')
      ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      console.log(`Found .env at: ${candidate}`);
      return candidate;
    }
  }

  // If no .env found in packaged mode, copy the bundled one to userData
  if (!isDev) {
    const userDataEnv = path.join(app.getPath('userData'), '.env');
    const bundledEnv = path.join(process.resourcesPath, 'app.asar.unpacked', '.env');
    if (fs.existsSync(bundledEnv)) {
      fs.copyFileSync(bundledEnv, userDataEnv);
      return userDataEnv;
    }
  }

  console.warn('No .env file found!');
  return null;
}

function startBackend() {
  const backendPath = isDev
    ? path.join(__dirname, '..', 'backend', 'src', 'server.js')
    : path.join(process.resourcesPath, 'backend', 'src', 'server.js');

  const envPath = findEnvFile();

  // Verify backend entry point exists
  if (!fs.existsSync(backendPath)) {
    console.error(`Backend not found at: ${backendPath}`);
    throw new Error(`Backend server.js not found at: ${backendPath}`);
  }

  console.log(`Starting backend from: ${backendPath}`);
  console.log(`Using .env from: ${envPath || 'environment variables only'}`);

  // Build env for the forked process, include all .env vars directly
  const backendEnv = {
    ...process.env,
    PORT: String(BACKEND_PORT),
    NODE_ENV: 'production'
  };

  // If we found an .env file, read it and inject vars into the child process env
  if (envPath) {
    backendEnv.DOTENV_CONFIG_PATH = envPath;
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.substring(0, eqIdx).trim();
            const value = trimmed.substring(eqIdx + 1).trim();
            backendEnv[key] = value;
          }
        }
      });
    } catch (e) {
      console.warn('Could not read .env file:', e.message);
    }
  }

  // Set NODE_PATH so the backend can find its node_modules
  const backendNodeModules = isDev
    ? path.join(__dirname, '..', 'backend', 'node_modules')
    : path.join(process.resourcesPath, 'backend', 'node_modules');

  backendEnv.NODE_PATH = backendNodeModules;

  backendProcess = fork(backendPath, [], {
    env: backendEnv,
    cwd: isDev
      ? path.join(__dirname, '..', 'backend')
      : path.join(process.resourcesPath, 'backend'),
    silent: true
  });

  backendProcess.stdout?.on('data', (data) => console.log(`[Backend] ${data}`));
  backendProcess.stderr?.on('data', (data) => console.error(`[Backend] ${data}`));

  backendProcess.on('exit', (code) => {
    console.log(`Backend process exited with code ${code}`);
    if (code !== 0 && code !== null) {
      console.error('Backend crashed! Attempting restart...');
    }
  });

  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 30; // 15 seconds max

    const check = () => {
      attempts++;
      if (attempts > maxAttempts) {
        reject(new Error('Backend failed to start within 15 seconds'));
        return;
      }

      const http = require('http');
      const req = http.get(`http://localhost:${BACKEND_PORT}/api/health`, (res) => {
        if (res.statusCode === 200) resolve();
        else setTimeout(check, 500);
      });
      req.on('error', () => setTimeout(check, 500));
      req.setTimeout(2000, () => {
        req.destroy();
        setTimeout(check, 500);
      });
    };
    setTimeout(check, 1500);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'CHEMIApp — Pharmacy Management',
    icon: path.join(__dirname, 'frontend', 'icons', 'icon-512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    show: false // Don't show until ready
  });

  // Show loading screen first
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the frontend
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In packaged mode, load the built frontend via the backend server
    // This way API calls to /api work naturally without needing absolute URLs
    mainWindow.loadURL(`http://localhost:${BACKEND_PORT}`);
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

// Build a simple menu
const menuTemplate = [
  {
    label: 'CHEMIApp',
    submenu: [
      { label: 'Dashboard', click: () => mainWindow?.loadURL(`http://localhost:${BACKEND_PORT}`) },
      { type: 'separator' },
      { role: 'reload' },
      { role: 'forceReload' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { role: 'resetZoom' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  }
];

app.whenReady().then(async () => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

  console.log('Starting backend server...');
  try {
    await startBackend();
    console.log('Backend started successfully on port', BACKEND_PORT);
  } catch (err) {
    console.error('Failed to start backend:', err);
    dialog.showErrorBox(
      'CHEMIApp - Startup Error',
      `Failed to start the backend server.\n\nError: ${err.message}\n\nPlease check:\n1. The .env file exists with correct database credentials\n2. Port ${BACKEND_PORT} is not in use\n3. You have internet access for the database connection`
    );
  }

  createWindow();
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
  app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});
