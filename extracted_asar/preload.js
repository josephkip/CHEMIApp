const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isDesktop: true,
  invoke: (channel, data) => ipcRenderer.invoke(channel, data)
});
