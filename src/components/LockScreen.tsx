import React, { useEffect, useState } from 'react';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { OSSettings, SecurityState, WallpaperOption } from '../types/os';
import { AppIcon } from './AppIcons';
import { LiveWallpaper } from './LiveWallpaper';

interface LockScreenProps {
  locked: boolean;
  wallpaper: WallpaperOption;
  settings: OSSettings;
  security: SecurityState;
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  locked,
  wallpaper,
  settings,
  security,
  onUnlock,
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [locked]);

  if (!locked) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setPassphrase('');
    onUnlock();
  };

  const showAnimated = !settings.customWallpaperUrl && wallpaper.kind === 'animated' && wallpaper.animatedId;
  const photoSrc = settings.customWallpaperUrl || wallpaper.src;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between py-14 px-6 bg-[#060709]"
      style={{ backgroundImage: wallpaper.fallbackGradient }}
    >
      {showAnimated && wallpaper.animatedId ? (
        <LiveWallpaper
          variant={wallpaper.animatedId}
          accentHex={settings.themeColor}
          className="absolute inset-0 opacity-55 pointer-events-none"
        />
      ) : (
        photoSrc && (
          <img
            src={photoSrc}
            alt=""
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
          />
        )
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/85 pointer-events-none" />

      <div className="relative z-10 flex items-center gap-2.5 text-xs text-[#B9C2CF]">
        <AppIcon appId="sl8" size={20} />
        <span className="font-display font-semibold tracking-wider text-white">
          SL8 DSK Experimental Build
        </span>
        <span aria-hidden="true">·</span>
        <span>Ubuntu 26.04 Hardened</span>
      </div>

      <div className="relative z-10 w-full max-w-sm text-center space-y-8">
        <div>
          <p className="font-display text-6xl font-semibold tracking-tight text-white tabular-nums">
            {now.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: !settings.clock24Hour,
            })}
          </p>
          <p className="text-sm text-[#94A0B2] mt-2">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <form
          onSubmit={handleUnlock}
          className="p-6 rounded-none sl8-frosted-pane border border-white/15 shadow-2xl space-y-4 text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-sm font-semibold text-white">
                {settings.username}@{settings.hostname}
              </p>
              <p className="text-xs text-[#8E9AA9]">LUKS2 Encrypted Session</p>
            </div>
            <Lock className="w-4 h-4" style={{ color: 'var(--sl8-accent)' }} />
          </div>

          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Enter passphrase or press Enter"
            autoFocus
            className="w-full px-3.5 py-2.5 rounded-none bg-[#06080C] border border-white/15 text-sm text-white placeholder-[#6B7687] focus:outline-none focus:border-[var(--sl8-accent)]"
          />

          <button
            type="submit"
            style={{ backgroundColor: 'var(--sl8-accent)', color: '#05080C' }}
            className="w-full py-2.5 px-4 rounded-none font-display text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          >
            <span>Unlock Session</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="relative z-10 flex items-center gap-2 text-xs text-[#94A0B2]">
        <ShieldCheck className="w-4 h-4" style={{ color: 'var(--sl8-accent)' }} />
        <span>
          Centurion {security.firewallEnabled ? 'Active' : 'Paused'} · WireGuard{' '}
          {security.vpnEnabled ? security.vpnExitNode : 'Disconnected'}
        </span>
      </div>
    </div>
  );
};
