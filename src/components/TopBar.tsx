import React, { useEffect, useState, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  Lock,
  Wifi,
  WifiOff,
  Globe,
  Volume2,
  Sun,
  CameraOff,
  MicOff,
  MapPinOff,
  SlidersHorizontal,
  RotateCcw,
  RefreshCw,
  Check,
  Sparkles,
} from 'lucide-react';
import { AppId, OSSettings, SecurityState, WifiNetwork, WifiState } from '../types/os';
import { AppIcon } from './AppIcons';

interface TopBarProps {
  activeAppTitle: string;
  security: SecurityState;
  settings: OSSettings;
  wifi: WifiState;
  launcherOpen: boolean;
  onToggleLauncher: () => void;
  onOpenApp: (appId: AppId) => void;
  onToggleVpn: () => void;
  onToggleKillSwitch: (key: keyof SecurityState['killSwitches']) => void;
  onToggleMacRandomize: () => void;
  onUpdateWifi: (updater: (prev: WifiState) => WifiState) => void;
  onUpdateSettings: (patch: Partial<OSSettings>) => void;
  onStartScreensaver: () => void;
  onLockSession: () => void;
  onReplayBoot: () => void;
}

const SignalBars: React.FC<{ strength: 1 | 2 | 3 | 4; active?: boolean }> = ({ strength, active }) => (
  <span className="inline-flex items-end gap-[2px] h-3" aria-hidden="true">
    {[1, 2, 3, 4].map((level) => (
      <span
        key={level}
        className="w-[2.5px]"
        style={{
          height: `${level * 25}%`,
          backgroundColor:
            level <= strength
              ? active
                ? 'var(--sl8-accent)'
                : '#D5DCE6'
              : 'rgba(255,255,255,0.16)',
        }}
      />
    ))}
  </span>
);

export const TopBar: React.FC<TopBarProps> = ({
  activeAppTitle,
  security,
  settings,
  wifi,
  launcherOpen,
  onToggleLauncher,
  onOpenApp,
  onToggleVpn,
  onToggleKillSwitch,
  onToggleMacRandomize,
  onUpdateWifi,
  onUpdateSettings,
  onStartScreensaver,
  onLockSession,
  onReplayBoot,
}) => {
  const [now, setNow] = useState(() => new Date());
  const [openPopover, setOpenPopover] = useState<'clock' | 'wifi' | 'privacy' | 'system' | null>(null);
  const [scanningWifi, setScanningWifi] = useState(false);
  const [promptSsid, setPromptSsid] = useState<string | null>(null);
  const [wifiPassphrase, setWifiPassphrase] = useState('');
  const barRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOutside = (e: PointerEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenPopover(null);
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, []);

  const activeProtections = [
    security.firewallEnabled,
    security.vpnEnabled,
    security.killSwitches.camera,
    security.killSwitches.microphone,
    security.killSwitches.telemetryBlocked,
  ].filter(Boolean).length;

  const connectedNetwork = wifi.enabled
    ? wifi.networks.find((n) => n.ssid === wifi.connectedSsid) ?? null
    : null;

  const handleToggleWifiRadio = () => {
    setPromptSsid(null);
    setWifiPassphrase('');
    onUpdateWifi((prev) => {
      if (prev.enabled) {
        return { ...prev, enabled: false };
      }
      const fallbackSsid = prev.connectedSsid ?? prev.networks.find((n) => n.known)?.ssid ?? null;
      return { ...prev, enabled: true, connectedSsid: fallbackSsid };
    });
  };

  const handleRescanWifi = () => {
    if (!wifi.enabled || scanningWifi) return;
    setScanningWifi(true);
    setTimeout(() => {
      onUpdateWifi((prev) => ({
        ...prev,
        networks: prev.networks.map((net) => {
          if (net.ssid === prev.connectedSsid) return net;
          const delta = Math.random() > 0.5 ? 1 : -1;
          const nextSig = Math.max(1, Math.min(4, net.signal + (Math.random() > 0.6 ? delta : 0))) as
            | 1
            | 2
            | 3
            | 4;
          return { ...net, signal: nextSig };
        }),
      }));
      setScanningWifi(false);
    }, 650);
  };

  const handleSelectNetwork = (net: WifiNetwork) => {
    if (!wifi.enabled) return;
    if (net.ssid === wifi.connectedSsid) return;
    if (net.secured && !net.known) {
      setPromptSsid(net.ssid);
      setWifiPassphrase('');
      return;
    }
    setPromptSsid(null);
    const octet = 20 + Math.floor(Math.random() * 200);
    onUpdateWifi((prev) => ({
      ...prev,
      connectedSsid: net.ssid,
      ipAddress: `192.168.1.${octet}`,
    }));
  };

  const handleConnectSecured = (e: React.FormEvent, ssid: string) => {
    e.preventDefault();
    if (wifiPassphrase.trim().length < 4) return;
    const octet = 20 + Math.floor(Math.random() * 200);
    onUpdateWifi((prev) => ({
      ...prev,
      connectedSsid: ssid,
      ipAddress: `192.168.1.${octet}`,
      networks: prev.networks.map((n) => (n.ssid === ssid ? { ...n, known: true } : n)),
    }));
    setPromptSsid(null);
    setWifiPassphrase('');
  };

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !settings.clock24Hour,
  });

  return (
    <header
      ref={barRef}
      className={`fixed top-0 left-0 right-0 h-[38px] z-50 flex items-center justify-between px-3 border-b border-white/[0.14] select-none rounded-none ${
        settings.reduceTransparency ? 'bg-[#080A0F]' : 'sl8-frosted-bar'
      }`}
    >
      {/* Left Zone: SL8 Launcher & Experimental Build Identifier */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => {
            setOpenPopover(null);
            onToggleLauncher();
          }}
          style={launcherOpen ? { color: 'var(--sl8-accent)', backgroundColor: 'var(--sl8-accent-soft)' } : undefined}
          className="flex items-center gap-2 px-2 py-1 rounded-none text-xs font-display font-semibold tracking-wider text-white hover:bg-white/[0.08] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--sl8-accent)]"
        >
          <AppIcon appId="sl8" size={16} />
          <span>SL8 DSK Experimental Build</span>
        </button>

        {activeAppTitle !== 'SL8 DSK Experimental Build' && (
          <>
            <span className="h-3.5 w-px bg-white/15 shrink-0 hidden sm:block" aria-hidden="true" />
            <span className="text-xs font-medium text-[#B9C2CF] truncate whitespace-nowrap hidden sm:inline">
              {activeAppTitle}
            </span>
          </>
        )}
      </div>

      {/* Center Zone: Date & Time */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenPopover((p) => (p === 'clock' ? null : 'clock'))}
          className="px-3 py-1 rounded-none text-xs font-medium text-[#E6EAF0] hover:bg-white/[0.08] transition-colors flex items-center gap-2 whitespace-nowrap tabular-nums focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--sl8-accent)]"
        >
          <span className="text-[#9AA5B6] hidden md:inline">{formattedDate}</span>
          <span className="font-mono text-white">{formattedTime}</span>
        </button>

        {openPopover === 'clock' && (
          <div className="absolute left-1/2 -translate-x-1/2 top-[40px] w-72 rounded-none sl8-frosted-pane border border-white/15 p-4 text-left">
            <div className="flex items-baseline justify-between pb-3 border-b border-white/[0.1]">
              <div>
                <p className="font-display text-lg font-semibold text-white tabular-nums">{formattedTime}</p>
                <p className="text-xs text-[#9AA5B6]">
                  {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpenPopover(null);
                  onOpenApp('calendar');
                }}
                style={{ color: 'var(--sl8-accent)' }}
                className="text-xs hover:underline"
              >
                Calendar
              </button>
            </div>
            <div className="pt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#B9C2CF]">
                <span>OS Base</span>
                <span className="font-mono text-white">Ubuntu 26.04 LTS</span>
              </div>
              <div className="flex items-center justify-between text-[#B9C2CF]">
                <span>Kernel</span>
                <span className="font-mono text-white">6.12.8-sl8-hardened</span>
              </div>
              <div className="flex items-center justify-between text-[#B9C2CF]">
                <span>Centurion</span>
                <span className="font-mono" style={{ color: 'var(--sl8-accent)' }}>
                  {activeProtections}/5 Active
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Zone: Wi-Fi, VPN, Centurion & System Controls */}
      <div className="flex items-center gap-0.5 shrink-0 relative">
        {/* Wi-Fi Indicator & Settings Trigger */}
        <button
          type="button"
          onClick={() => setOpenPopover((p) => (p === 'wifi' ? null : 'wifi'))}
          title={
            !wifi.enabled
              ? 'Wi-Fi Off'
              : connectedNetwork
              ? `Connected to ${connectedNetwork.ssid} (${connectedNetwork.band})`
              : 'Wi-Fi On · Not Connected'
          }
          style={
            openPopover === 'wifi'
              ? { color: 'var(--sl8-accent)', backgroundColor: 'var(--sl8-accent-soft)' }
              : undefined
          }
          className={`h-7 px-2.5 rounded-none flex items-center gap-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            openPopover === 'wifi'
              ? ''
              : wifi.enabled && connectedNetwork
              ? 'text-[#E6EAF0] hover:bg-white/[0.08]'
              : 'text-[#8E9AA9] hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          {wifi.enabled && connectedNetwork ? (
            <>
              <Wifi className="w-3.5 h-3.5" style={{ color: 'var(--sl8-accent)' }} />
              <span className="hidden md:inline max-w-[104px] truncate">{connectedNetwork.ssid}</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-[#8E9AA9]" />
              <span className="hidden md:inline">{wifi.enabled ? 'No Wi-Fi' : 'Wi-Fi Off'}</span>
            </>
          )}
        </button>

        {/* WireGuard VPN Toggle */}
        <button
          type="button"
          onClick={onToggleVpn}
          title={security.vpnEnabled ? `WireGuard VPN active (${security.vpnExitNode})` : 'WireGuard VPN disconnected'}
          style={
            security.vpnEnabled
              ? { color: 'var(--sl8-accent)', backgroundColor: 'var(--sl8-accent-soft)' }
              : undefined
          }
          className="h-7 px-2.5 rounded-none flex items-center gap-1.5 text-xs font-medium text-[#94A0B2] hover:text-white hover:bg-white/[0.08] transition-colors whitespace-nowrap shrink-0"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{security.vpnEnabled ? security.vpnExitNode.split(' ')[0] : 'VPN Off'}</span>
        </button>

        {/* Centurion Quick Kill-Switches */}
        <button
          type="button"
          onClick={() => setOpenPopover((p) => (p === 'privacy' ? null : 'privacy'))}
          title="Centurion Quick Kill-Switches"
          className={`h-7 px-2.5 rounded-none flex items-center gap-1.5 text-xs transition-colors whitespace-nowrap shrink-0 ${
            openPopover === 'privacy'
              ? 'bg-white/12 text-white'
              : security.firewallEnabled
              ? 'text-[#E6EAF0] hover:bg-white/[0.08]'
              : 'text-amber-400 hover:bg-white/[0.08]'
          }`}
        >
          {security.firewallEnabled ? (
            <Shield className="w-3.5 h-3.5" style={{ color: 'var(--sl8-accent)' }} />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="hidden lg:inline">Centurion</span>
        </button>

        {/* System Controls */}
        <button
          type="button"
          onClick={() => setOpenPopover((p) => (p === 'system' ? null : 'system'))}
          aria-label="System controls"
          className={`h-7 w-8 rounded-none flex items-center justify-center transition-colors ${
            openPopover === 'system' ? 'bg-white/12 text-white' : 'text-[#B9C2CF] hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>

        {/* Lock Session */}
        <button
          type="button"
          onClick={() => {
            setOpenPopover(null);
            onLockSession();
          }}
          aria-label="Lock session"
          title="Lock Session"
          className="h-7 w-8 rounded-none flex items-center justify-center text-[#B9C2CF] hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <Lock className="w-3.5 h-3.5" />
        </button>

        {/* Wi-Fi Settings Popover */}
        {openPopover === 'wifi' && (
          <div className="absolute right-0 top-[40px] w-80 rounded-none sl8-frosted-pane border border-white/15 p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.1]">
              <div className="flex items-center gap-2">
                {wifi.enabled ? (
                  <Wifi className="w-4 h-4" style={{ color: 'var(--sl8-accent)' }} />
                ) : (
                  <WifiOff className="w-4 h-4 text-[#8E9AA9]" />
                )}
                <span className="font-display text-sm font-semibold text-white">Wi-Fi Settings</span>
              </div>
              <button
                type="button"
                onClick={handleToggleWifiRadio}
                style={
                  wifi.enabled
                    ? { backgroundColor: 'var(--sl8-accent)', color: '#05080C' }
                    : undefined
                }
                className={`px-2.5 py-1 rounded-none text-[11px] font-mono font-semibold ${
                  wifi.enabled ? '' : 'bg-white/10 text-[#B9C2CF]'
                }`}
              >
                {wifi.enabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {!wifi.enabled ? (
              <div className="py-5 text-center space-y-2">
                <WifiOff className="w-6 h-6 text-[#6B7687] mx-auto" />
                <p className="text-xs text-[#94A0B2]">Wireless interface (wlp3s0) is powered down.</p>
              </div>
            ) : (
              <>
                {connectedNetwork && (
                  <div className="p-3 rounded-none bg-white/[0.04] border border-white/[0.1] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{connectedNetwork.ssid}</p>
                        <p className="text-[10px] font-mono text-[#8E9AA9]">
                          {connectedNetwork.band} · {connectedNetwork.speedMbps} Mbps · {wifi.ipAddress}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onUpdateWifi((prev) => ({ ...prev, connectedSsid: null }))}
                        className="px-2 py-1 rounded-none bg-white/[0.07] hover:bg-red-500/20 hover:text-red-200 text-[10px] font-mono text-[#C8D0DC] shrink-0"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono tracking-wider text-[#8E9AA9]">
                      AVAILABLE NETWORKS
                    </span>
                    <button
                      type="button"
                      onClick={handleRescanWifi}
                      className="flex items-center gap-1 text-[11px] text-[#B9C2CF] hover:text-white"
                    >
                      <RefreshCw className={`w-3 h-3 ${scanningWifi ? 'animate-spin' : ''}`} />
                      <span>{scanningWifi ? 'Scanning' : 'Rescan'}</span>
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {wifi.networks.map((net) => {
                      const isConnected = net.ssid === wifi.connectedSsid;
                      const isPrompting = promptSsid === net.ssid;
                      return (
                        <div key={net.ssid} className="border border-white/[0.06] bg-white/[0.02]">
                          <button
                            type="button"
                            onClick={() => handleSelectNetwork(net)}
                            className={`w-full px-2.5 py-2 rounded-none flex items-center justify-between gap-2 text-left transition-colors ${
                              isConnected ? 'bg-white/[0.07]' : 'hover:bg-white/[0.06]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <SignalBars strength={net.signal} active={isConnected} />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-white truncate flex items-center gap-1.5">
                                  <span className="truncate">{net.ssid}</span>
                                  {isConnected && (
                                    <Check className="w-3 h-3 shrink-0" style={{ color: 'var(--sl8-accent)' }} />
                                  )}
                                </p>
                                <p className="text-[10px] font-mono text-[#7F8B9B]">
                                  {net.band} · {net.secured ? 'WPA3' : 'Open'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {net.secured && <Lock className="w-3 h-3 text-[#7F8B9B]" />}
                              <span
                                className="text-[10px] font-mono"
                                style={{ color: isConnected ? 'var(--sl8-accent)' : '#7F8B9B' }}
                              >
                                {isConnected ? 'CONNECTED' : net.known || !net.secured ? 'JOIN' : 'KEY'}
                              </span>
                            </div>
                          </button>

                          {isPrompting && (
                            <form
                              onSubmit={(e) => handleConnectSecured(e, net.ssid)}
                              className="px-2.5 pb-2.5 pt-1 flex items-center gap-1.5 border-t border-white/[0.06]"
                            >
                              <input
                                type="password"
                                value={wifiPassphrase}
                                onChange={(e) => setWifiPassphrase(e.target.value)}
                                placeholder="WPA3 Passphrase (4+ chars)"
                                autoFocus
                                className="flex-1 min-w-0 px-2 py-1 rounded-none bg-[#06080C] border border-white/15 text-xs text-white placeholder-[#6B7687] focus:outline-none focus:border-[var(--sl8-accent)]"
                              />
                              <button
                                type="submit"
                                style={{ backgroundColor: 'var(--sl8-accent)', color: '#05080C' }}
                                className="px-2.5 py-1 rounded-none text-[11px] font-semibold shrink-0"
                              >
                                Join
                              </button>
                            </form>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <div className="pt-2.5 border-t border-white/[0.1] flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-[#E6EAF0]">Randomize MAC Address</p>
                <p className="text-[10px] text-[#7F8B9B]">Centurion interface privacy</p>
              </div>
              <button
                type="button"
                onClick={onToggleMacRandomize}
                className="px-2.5 py-1 rounded-none bg-white/[0.06] hover:bg-white/[0.12] text-[10px] font-mono"
                style={{
                  color: security.kernelHardening.macRandomize ? 'var(--sl8-accent)' : '#8E9AA9',
                }}
              >
                {security.kernelHardening.macRandomize ? 'ACTIVE' : 'OFF'}
              </button>
            </div>
          </div>
        )}

        {/* Centurion Quick Kill-Switches Popover */}
        {openPopover === 'privacy' && (
          <div className="absolute right-0 top-[40px] w-72 rounded-none sl8-frosted-pane border border-white/15 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.1]">
              <span className="font-display text-sm font-semibold text-white">Centurion Guard</span>
              <button
                type="button"
                onClick={() => {
                  setOpenPopover(null);
                  onOpenApp('centurion');
                }}
                style={{ color: 'var(--sl8-accent)' }}
                className="text-xs hover:underline"
              >
                Open Centurion
              </button>
            </div>
            <div className="pt-3 space-y-1.5">
              {(
                [
                  { key: 'camera', label: 'Camera Hardware Cut', icon: CameraOff },
                  { key: 'microphone', label: 'Microphone Hardware Cut', icon: MicOff },
                  { key: 'location', label: 'Geolocation Blocked', icon: MapPinOff },
                ] as const
              ).map((item) => {
                const active = security.killSwitches[item.key];
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onToggleKillSwitch(item.key)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-none bg-white/[0.04] hover:bg-white/[0.08] transition-colors text-left"
                  >
                    <span className="flex items-center gap-2 text-xs text-[#E6EAF0]">
                      <Icon className="w-3.5 h-3.5 text-[#94A0B2]" />
                      {item.label}
                    </span>
                    <span
                      className="text-[11px] font-mono"
                      style={{ color: active ? 'var(--sl8-accent)' : '#6B7687' }}
                    >
                      {active ? 'BLOCKED' : 'ALLOW'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* System Controls Popover */}
        {openPopover === 'system' && (
          <div className="absolute right-0 top-[40px] w-72 rounded-none sl8-frosted-pane border border-white/15 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-white">System Controls</span>
              <button
                type="button"
                onClick={() => {
                  setOpenPopover(null);
                  onOpenApp('settings');
                }}
                style={{ color: 'var(--sl8-accent)' }}
                className="text-xs hover:underline"
              >
                Settings
              </button>
            </div>

            <div className="space-y-3">
              <label className="block space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#B9C2CF]">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-[#94A0B2]" />
                    Output Audio
                  </span>
                  <span className="font-mono tabular-nums text-white">{settings.volume}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings.volume}
                  onChange={(e) => onUpdateSettings({ volume: Number(e.target.value) })}
                  style={{ accentColor: 'var(--sl8-accent)' }}
                  className="w-full cursor-pointer"
                />
              </label>

              <label className="block space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#B9C2CF]">
                  <span className="flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-[#94A0B2]" />
                    Display Luminance
                  </span>
                  <span className="font-mono tabular-nums text-white">{settings.brightness}%</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={100}
                  value={settings.brightness}
                  onChange={(e) => onUpdateSettings({ brightness: Number(e.target.value) })}
                  style={{ accentColor: 'var(--sl8-accent)' }}
                  className="w-full cursor-pointer"
                />
              </label>
            </div>

            <div className="pt-2 border-t border-white/[0.1] space-y-2">
              <button
                type="button"
                onClick={() => {
                  setOpenPopover(null);
                  onStartScreensaver();
                }}
                className="w-full py-2 px-3 rounded-none bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--sl8-accent)' }} />
                Start Screensaver
              </button>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpenPopover(null);
                    onLockSession();
                  }}
                  className="flex-1 py-2 px-3 rounded-none bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-white flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" style={{ color: 'var(--sl8-accent)' }} />
                  Lock
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenPopover(null);
                    onReplayBoot();
                  }}
                  className="flex-1 py-2 px-3 rounded-none bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-[#B9C2CF] hover:text-white flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reboot Intro
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
