const { contextBridge, ipcRenderer } = require('electron');

const permittedActions = ['shutdown', 'restart', 'logout'];

contextBridge.exposeInMainWorld('sl8System', {
  power: (action) => {
    if (!permittedActions.includes(action)) {
      return Promise.resolve({ ok: false, error: 'Unsupported power action' });
    }
    return ipcRenderer.invoke('sl8:power', action);
  },
});
