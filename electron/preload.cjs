const { contextBridge, ipcRenderer } = require('electron');

const permittedActions = ['shutdown', 'restart', 'logout'];

contextBridge.exposeInMainWorld('sl8System', {
  network: (action, payload = {}) => {
    const allowed = ['devices', 'connections', 'details', 'wifi-list', 'wifi-radio', 'wifi-status', 'disconnect', 'connect-saved', 'wifi-connect'];
    if (!allowed.includes(action)) {
      return Promise.resolve({ ok: false, error: 'Unsupported network action.' });
    }
    return ipcRenderer.invoke('sl8:network', action, payload);
  },
  power: (action) => {
    if (!permittedActions.includes(action)) {
      return Promise.resolve({ ok: false, error: 'Unsupported power action' });
    }
    return ipcRenderer.invoke('sl8:power', action);
  },
});
