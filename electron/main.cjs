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


// NetworkManager is the authority for device state. Only fixed nmcli verbs
// are permitted; never interpolate user input into a shell command.
function runNmcli(args, timeout = 12000) {
  return new Promise((resolve) => {
    execFile('nmcli', args, { timeout, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      resolve(error
        ? { ok: false, error: (stderr || error.message).trim() }
        : { ok: true, output: stdout.trim() });
    });
  });
}

ipcMain.handle('sl8:network', async (_event, action, payload = {}) => {
  if (process.platform !== 'linux') return { ok: false, error: 'NetworkManager requires Linux.' };
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, error: 'Invalid network request.' };
  }
  const validId = (value) => typeof value === 'string' && /^[a-zA-Z0-9_.:-]{1,80}$/.test(value);
  const validUuid = (value) => typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  switch (action) {
    case 'devices':
      return runNmcli(['-t', '-f', 'DEVICE,TYPE,STATE,CONNECTION', 'device', 'status']);
    case 'connections':
      return runNmcli(['-t', '-f', 'UUID,NAME,TYPE,DEVICE', 'connection', 'show']);
    case 'details':
      return validId(payload.device)
        ? runNmcli(['-t', '-f', 'GENERAL,IP4', 'device', 'show', payload.device])
        : { ok: false, error: 'Invalid device.' };
    case 'wifi-list':
      return runNmcli(['-t', '-f', 'IN-USE,SSID,SIGNAL,SECURITY,FREQ', 'device', 'wifi', 'list', '--rescan', 'yes'], 25000);
    case 'wifi-radio':
      return typeof payload.enabled === 'boolean'
        ? runNmcli(['radio', 'wifi', payload.enabled ? 'on' : 'off'])
        : { ok: false, error: 'Invalid radio state.' };
    case 'wifi-status':
      return runNmcli(['-t', '-f', 'WIFI', 'radio']);
    case 'disconnect':
      return validId(payload.device)
        ? runNmcli(['device', 'disconnect', payload.device], 25000)
        : { ok: false, error: 'Invalid device.' };
    case 'connect-saved':
      return validUuid(payload.uuid)
        ? runNmcli(['connection', 'up', 'uuid', payload.uuid], 35000)
        : { ok: false, error: 'Invalid connection UUID.' };
    case 'wifi-connect': {
      const ssid = payload.ssid;
      const password = payload.password;
      if (typeof ssid !== 'string' || !ssid || ssid.length > 32 || /[\x00-\x1f]/.test(ssid)) {
        return { ok: false, error: 'Invalid Wi-Fi network name.' };
      }
      if (password !== undefined && (typeof password !== 'string' || password.length > 128)) {
        return { ok: false, error: 'Invalid Wi-Fi password.' };
      }
      // -- prevents SSIDs beginning with a dash from being parsed as options.
      if (!password) return runNmcli(['--wait', '35', 'device', 'wifi', 'connect', ssid], 45000);
      // Never put Wi-Fi credentials in process arguments or logs.
      return new Promise((resolve) => {
        const child = execFile('nmcli',
          ['--wait', '35', '--passwd-file', '/dev/stdin', 'device', 'wifi', 'connect', ssid],
          { timeout: 45000, maxBuffer: 1024 * 1024 },
          (error, stdout, stderr) => resolve(error
            ? { ok: false, error: (stderr || error.message).trim() }
            : { ok: true, output: stdout.trim() }));
        child.stdin.on('error', () => {});
        child.stdin.end('802-11-wireless-security.psk:' + password + '\\n');
      });
    }
    default:
      return { ok: false, error: 'Unsupported network action.' };
  }
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
