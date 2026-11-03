const { contextBridge, ipcRenderer } = require('electron');

const settingsApi = {
  exists: () => ipcRenderer.invoke('settings:exists'),
  load: () => ipcRenderer.invoke('settings:load'),
  save: (settingsData) => ipcRenderer.invoke('settings:save', settingsData),
  verifyPassword: (password) => ipcRenderer.invoke('settings:verifyPassword', password),
  createInitial: (initialData) => ipcRenderer.invoke('settings:createInitial', initialData)
};

// Expose window.api.settings as specified in prompt requirement
contextBridge.exposeInMainWorld('api', {
  settings: settingsApi
});

// Also expose under window.electronAPI for full backwards compatibility
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  settings: settingsApi,
  savePdfReport: (payload) => ipcRenderer.invoke('save-pdf-report', payload),
  showInFolder: (filePath) => ipcRenderer.invoke('show-in-folder', filePath),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.invoke('is-fullscreen'),
  onFullscreenChanged: (callback) => ipcRenderer.on('window-fullscreen-changed', (event, isFull) => callback(isFull)),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  getDesktopPath: () => ipcRenderer.invoke('get-desktop-path'),
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url)
});

