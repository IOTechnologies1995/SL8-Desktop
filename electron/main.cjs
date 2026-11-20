const { app, BrowserWindow, ipcMain } = require('electron');
const { execFile } = require('node:child_process');
const path = require('node:path');

function createWindow() {
  const win = new BrowserWindow({
    show: true,
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#060709',
    title: 'SL8 Desktop OS',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

   win.setFullScreen(true);
   win.loadFile(path.join(__dirname, '../dist/index.html'));
}

// Never run arbitrary commands from the renderer. The OS, not the UI, decides
// whether the current user is authorized to perform each system action.
ipcMain.handle('sl8:power', async (_event, action) => {
  const commands = {
    shutdown: ['systemctl', ['poweroff']],
    restart: ['systemctl', ['reboot']],
  };
  if (action === 'logout') {
    // Ask Plasma to perform its normal logout sequence. Forcibly terminating
    // the loginctl session can strand SDDM on a black screen after logout.
    if (process.platform !== 'linux' || !process.env.DBUS_SESSION_BUS_ADDRESS) {
      return { ok: false, error: 'A graphical Linux session bus is required to log out.' };
    }
    commands.logout = [
      '/usr/bin/qdbus6',
      ['org.kde.Shutdown', '/Shutdown', 'org.kde.Shutdown.logout'],
    ];
  }
  const command = commands[action];
  if (!command) return { ok: false, error: 'Unsupported power action' };
  return new Promise((resolve) => {
    execFile(command[0], command[1], { timeout: 15000 }, (error) => {
      resolve(error
        ? { ok: false, error: error.message }
        : { ok: true });
    });
  });
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
