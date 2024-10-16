const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  searchApps: (searchTerm) => ipcRenderer.invoke('search-apps', searchTerm),
  launchApp: (command) => ipcRenderer.send('launch-app', command),
  hideWindow: () => ipcRenderer.send('hide-window')
})
