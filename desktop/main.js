const { app, BrowserWindow, Menu, protocol, net, dialog } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;

const isDev = !app.isPackaged;

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
    if (!isDev) {
      // Check for updates shortly after app starts
      setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify();
      }, 3000);
    }
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

// Auto-Updater Events
autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: 'A new version of CHEMIApp is available. Downloading now...'
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'The update has been downloaded. Restart the application to apply the updates.',
    buttons: ['Restart', 'Later']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

const menuTemplate = [
  {
    label: 'CHEMIApp',
    submenu: [
      { label: 'Dashboard', click: () => mainWindow?.loadURL(`app://-/`) },
      { type: 'separator' },
      { label: 'Check for Updates', click: () => autoUpdater.checkForUpdatesAndNotify() },
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
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});
