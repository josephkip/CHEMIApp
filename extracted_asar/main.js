const { app, BrowserWindow, Menu, dialog, protocol, net, ipcMain } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const fs = require('fs');
const crypto = require('crypto');
const http = require('http');

// Prevent EPIPE crashes when console.log writes to a broken pipe in packaged GUI mode
if (process.stdout) {
  process.stdout.on('error', err => { if (err.code === 'EPIPE') return; });
}
if (process.stderr) {
  process.stderr.on('error', err => { if (err.code === 'EPIPE') return; });
}

let mainWindow;

const isDev = !app.isPackaged;
const PIPE_NAME = '\\\\.\\pipe\\chemiapp-api-' + crypto.randomBytes(8).toString('hex');

function findEnvFile() {
  const candidates = isDev
    ? [
        path.join(__dirname, '..', '.env'),
        path.join(__dirname, '.env')
      ]
    : [
        path.join(__dirname, '.env'), // Bundled inside app.asar
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
  return null;
}

async function startBackend() {
  const envPath = findEnvFile();
  
  if (envPath) {
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.substring(0, eqIdx).trim();
            const value = trimmed.substring(eqIdx + 1).trim();
            process.env[key] = value;
          }
        }
      });
    } catch (e) {
      console.warn('Could not read .env file:', e.message);
    }
  }

  if (!isDev) {
    process.env.NODE_ENV = 'production';
  }

  // Add backend node_modules to paths so require works seamlessly
  const backendNodeModules = isDev
    ? path.join(__dirname, '..', 'backend', 'node_modules')
    : path.join(process.resourcesPath, 'backend', 'node_modules');
  require('module').globalPaths.push(backendNodeModules);

  // Load the express app directly in the Main Process
  const backendAppPath = isDev
    ? path.join(__dirname, '..', 'backend', 'src', 'app.js')
    : path.join(process.resourcesPath, 'backend', 'src', 'app.js');
    
  const backendDbPath = isDev
    ? path.join(__dirname, '..', 'backend', 'src', 'config', 'database.js')
    : path.join(process.resourcesPath, 'backend', 'src', 'config', 'database.js');

  const expressApp = require(backendAppPath);
  require(backendDbPath); // Initialize DB

  return new Promise((resolve, reject) => {
    expressApp.listen(PIPE_NAME, () => {
      console.log(`Backend Express Server listening on Named Pipe: ${PIPE_NAME}`);
      resolve();
    }).on('error', reject);
  });
}

function setupIpcBridge() {
  ipcMain.handle('api-request', (event, reqData) => {
    return new Promise((resolve, reject) => {
      const sendData = reqData.data ? (typeof reqData.data === 'string' ? reqData.data : JSON.stringify(reqData.data)) : null;
      
      const headers = {};
      for (const [key, value] of Object.entries(reqData.headers || {})) {
        headers[key.toLowerCase()] = value;
      }
      
      if (sendData) {
        headers['content-length'] = Buffer.byteLength(sendData);
        if (!headers['content-type']) {
          headers['content-type'] = 'application/json';
        }
      } else {
        delete headers['content-length'];
      }

      const logFile = path.join(app.getPath('userData'), 'ipc-debug.log');
      fs.appendFileSync(logFile, `\n[IPC REQ] ${reqData.method} ${reqData.url}\nHeaders: ${JSON.stringify(headers)}\nData: ${sendData}\n`);

      const options = {
        socketPath: PIPE_NAME,
        path: reqData.url,
        method: reqData.method,
        headers: headers
      };
      
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          fs.appendFileSync(logFile, `[IPC RES] ${res.statusCode} | Body: ${body}\n`);
          let parsedData = body;
          try { parsedData = JSON.parse(body); } catch(e){}
          resolve({ status: res.statusCode, headers: res.headers, data: parsedData });
        });
      });
      
      req.on('error', (err) => {
        fs.appendFileSync(logFile, `[IPC ERR] ${err.message}\n`);
        reject(err);
      });
      if (sendData) {
        req.write(sendData);
      }
      req.end();
    });
  });
}

function createWindow() {
  // Register custom protocol for the UI
  protocol.handle('app', (request) => {
    let urlPath = new URL(request.url).pathname;
    if (urlPath === '/' || !urlPath) urlPath = '/index.html';
    
    let baseDir = isDev 
      ? path.join(__dirname, '..', 'frontend', 'dist')
      : path.join(__dirname, 'frontend');
    
    let filePath = path.join(baseDir, urlPath);
    if (!fs.existsSync(filePath)) {
      // SPA fallback
      filePath = path.join(baseDir, 'index.html');
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });

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

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev && fs.existsSync(path.join(__dirname, '..', 'frontend', 'dist'))) {
     mainWindow.loadURL('app://-/');
     mainWindow.webContents.openDevTools();
  } else if (isDev) {
     // fallback to Vite server if dev hasn't built
     mainWindow.loadURL('http://localhost:5173');
     mainWindow.webContents.openDevTools();
  } else {
     mainWindow.loadURL('app://-/');
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

const menuTemplate = [
  {
    label: 'CHEMIApp',
    submenu: [
      { label: 'Dashboard', click: () => mainWindow?.loadURL(`app://-/`) },
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

// Register protocol schema before ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true } }
]);

app.whenReady().then(async () => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

  console.log('Starting internal backend server...');
  try {
    await startBackend();
    setupIpcBridge();
    console.log('Backend bound to internal Named Pipe. No network ports are in use.');
  } catch (err) {
    console.error('Failed to start backend:', err);
    dialog.showErrorBox(
      'CHEMIApp - Startup Error',
      `Failed to initialize application core.\n\nError: ${err.message}\n\nPlease check database credentials.`
    );
  }

  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});
