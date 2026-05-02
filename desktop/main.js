// ═══════════════════════════════════════════════════════════════════
// CHEMIApp Desktop — Thin Client (connects to Vercel backend)
// No local server, no ports, no pipes. Pure HTTPS to cloud.
// ═══════════════════════════════════════════════════════════════════

const { app, BrowserWindow, Menu, dialog, protocol, net, shell } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const fs = require('fs');
const https = require('https');

// ── Prevent EPIPE crashes (no console in packaged Windows GUI apps) ──
process.stdout?.on('error', () => {});
process.stderr?.on('error', () => {});

let mainWindow;
const isDev = !app.isPackaged;

// ── Configuration ──
const API_BASE_URL = 'https://chemi-app-cvjv.vercel.app';
const HEALTH_ENDPOINT = `${API_BASE_URL}/api/health`;
const LOG_DIR = app.isPackaged ? app.getPath('userData') : __dirname;

// ── Logging ──
function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  try {
    fs.appendFileSync(path.join(LOG_DIR, 'chemiapp.log'), line);
  } catch (_) { /* ignore */ }
  try { console.log(msg); } catch (_) { /* ignore EPIPE */ }
}

// ── Health check — verify Vercel API is reachable ──
function checkApiHealth() {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 10000);
    
    https.get(HEALTH_ENDPOINT, (res) => {
      clearTimeout(timer);
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.status === 'ok');
        } catch (_) {
          resolve(false);
        }
      });
    }).on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

// ── Create the main application window ──
function createWindow() {
  // Register app:// protocol to serve the embedded frontend
  protocol.handle('app', (request) => {
    let urlPath = new URL(request.url).pathname;
    if (urlPath === '/' || !urlPath) urlPath = '/index.html';

    const baseDir = isDev
      ? path.join(__dirname, '..', 'frontend', 'dist')
      : path.join(__dirname, 'frontend');

    let filePath = path.join(baseDir, urlPath);
    if (!fs.existsSync(filePath)) {
      // SPA fallback — serve index.html for client-side routes
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
      preload: path.join(__dirname, 'preload.js'),
      // Allow the renderer to make HTTPS requests to Vercel
      webSecurity: true
    },
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log('Window shown');
  });

  // Load the embedded frontend
  if (isDev && fs.existsSync(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'))) {
    mainWindow.loadURL('app://-/');
    mainWindow.webContents.openDevTools();
  } else if (isDev) {
    // Fallback to Vite dev server if dist not built yet
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL('app://-/');
  }

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Application Menu ──
const menuTemplate = [
  {
    label: 'CHEMIApp',
    submenu: [
      { label: 'Dashboard', click: () => mainWindow?.loadURL('app://-/') },
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

// ── Register app:// as a privileged scheme BEFORE app.ready ──
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
]);

// ── App lifecycle ──
app.whenReady().then(async () => {
  log('App starting...');

  // Pre-flight: verify cloud API is reachable
  const apiOk = await checkApiHealth();
  if (apiOk) {
    log('API health check passed — Vercel backend is reachable');
  } else {
    log('API health check FAILED — Vercel backend unreachable');
    const result = await dialog.showMessageBox({
      type: 'warning',
      title: 'Connection Issue',
      message: 'Cannot reach the CHEMIApp server.\n\nPlease check your internet connection and try again.',
      buttons: ['Retry', 'Launch Anyway', 'Quit'],
      defaultId: 0,
      cancelId: 2
    });

    if (result.response === 0) {
      // Retry
      const retryOk = await checkApiHealth();
      if (!retryOk) {
        log('Retry also failed');
      } else {
        log('Retry succeeded');
      }
    } else if (result.response === 2) {
      app.quit();
      return;
    }
    // "Launch Anyway" falls through
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});

// ── Catch unhandled errors globally ──
process.on('uncaughtException', (err) => {
  log(`UNCAUGHT EXCEPTION: ${err.message}\n${err.stack}`);
});

process.on('unhandledRejection', (reason) => {
  log(`UNHANDLED REJECTION: ${reason}`);
});
