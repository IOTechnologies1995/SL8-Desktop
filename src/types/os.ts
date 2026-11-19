export type AppId =
  | 'netcom'
  | 'zhd2'
  | 'centurion'
  | 'spotify'
  | 'steam'
  | 'calculator'
  | 'calendar'
  | 'notes'
  | 'terminal'
  | 'files'
  | 'packages'
  | 'settings';

export interface AppDefinition {
  id: AppId;
  name: string;
  shortName: string;
  category: 'Core Suite' | 'Apps & Media' | 'System & Ubuntu';
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
}

export interface WindowInstance {
  id: string;
  appId: AppId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

export interface VirtualFile {
  id: string;
  name: string;
  path: string;
  parentPath: string;
  type: 'file' | 'folder';
  content?: string;
  encrypted?: boolean;
  sizeBytes: number;
  updatedAt: string;
  permissions: string;
}

export interface FirewallRule {
  id: string;
  port: string;
  protocol: 'TCP' | 'UDP' | 'ANY';
  direction: 'IN' | 'OUT';
  action: 'ALLOW' | 'DENY';
  service: string;
  enabled: boolean;
}

export interface AppSandboxProfile {
  id: string;
  appName: string;
  profile: string;
  networkAccess: 'Isolated' | 'WireGuard Only' | 'LAN Only' | 'Restricted';
  fsScope: string;
  enforced: boolean;
}

export interface SecurityState {
  firewallEnabled: boolean;
  firewallDefaultInbound: 'DENY' | 'ALLOW';
  vpnEnabled: boolean;
  vpnKillSwitch: boolean;
  vpnExitNode: string;
  dnsProvider: 'Quad9 DNSSEC' | 'Mullvad DoH' | 'Cloudflare DoH';
  killSwitches: {
    camera: boolean;
    microphone: boolean;
    location: boolean;
    bluetooth: boolean;
    telemetryBlocked: boolean;
  };
  kernelHardening: {
    ptraceScope: boolean;
    kptrRestrict: boolean;
    aslrFull: boolean;
    apparmorEnforce: boolean;
    macRandomize: boolean;
  };
  firewallRules: FirewallRule[];
  sandboxes: AppSandboxProfile[];
  lastAuditTime: string;
}

export interface MediaTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationSec: number;
  format: string;
  bitrate: string;
  mediaType: 'audio' | 'video';
  sourceType: 'synth' | 'local';
  objectUrl?: string;
  synthPreset?: 'obsidian' | 'horizon' | 'pulse' | 'velvet';
  pinned?: boolean;
}

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  history: string[];
  historyIndex: number;
  isPrivate: boolean;
}

export interface BrowserShieldSettings {
  blockTrackers: boolean;
  httpsOnly: boolean;
  fingerprintProtection: boolean;
  blockWebRTCLeak: boolean;
  blockThirdPartyCookies: boolean;
  trackersBlockedCount: number;
  sessionBlockedCount: number;
  dataSavedMb: number;
}

export interface UbuntuPackage {
  id: string;
  pkgName: string;
  displayName: string;
  version: string;
  category: 'Privacy & Network' | 'Security & Crypto' | 'Developer';
  source: 'APT (Ubuntu Hardened)' | 'Flatpak (Sandboxed)';
  size: string;
  description: string;
  installed: boolean;
}

export type AnimatedWallpaperId = 'anim-horizon' | 'anim-prism' | 'anim-matrix' | 'anim-aurora';

export type ScreensaverId =
  | 'gateway-clock'
  | 'glass-shards'
  | 'starfield-grid'
  | 'accent-ribbons';

export interface WallpaperOption {
  id: string;
  name: string;
  subtitle: string;
  kind: 'animated' | 'photo';
  animatedId?: AnimatedWallpaperId;
  src?: string;
  fallbackGradient: string;
}

export interface WifiNetwork {
  ssid: string;
  signal: 1 | 2 | 3 | 4;
  secured: boolean;
  band: '6 GHz' | '5 GHz' | '2.4 GHz';
  speedMbps: number;
  known?: boolean;
}

export interface WifiState {
  enabled: boolean;
  connectedSsid: string | null;
  ipAddress: string;
  networks: WifiNetwork[];
}

export interface ThemeColorOption {
  id: string;
  name: string;
  hex: string;
}

export interface CalendarEvent {
  id: string;
  dateKey: string; // YYYY-MM-DD
  title: string;
  time: string;
  category: 'System' | 'Personal' | 'Security';
}

export interface DesktopNote {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
}

export interface OSSettings {
  wallpaperId: string;
  customWallpaperUrl: string | null;
  themeColor: string;
  dockPosition: 'bottom' | 'left' | 'right';
  dockSize: 'compact' | 'standard' | 'large';
  autoHideDock: boolean;
  reduceTransparency: boolean;
  showDesktopClock: boolean;
  showDesktopWeather: boolean;
  clock24Hour: boolean;
  weatherCity: string;
  weatherUnit: 'F' | 'C';
  touchMode: boolean;
  screensaverId: ScreensaverId;
  screensaverTimeoutMin: number; // 0 = manual only
  hostname: string;
  username: string;
  volume: number;
  brightness: number;
}
