import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Lock, Shield, Wifi, Terminal, ArrowRight, FileText } from 'lucide-react';
import { AppId, SecurityState, UbuntuPackage, VirtualFile } from '../types/os';
import { APP_DEFINITIONS } from '../data/initialState';
import { AppIcon } from './AppIcons';

interface SL8LauncherProps {
  open: boolean;
  files: VirtualFile[];
  packages: UbuntuPackage[];
  security: SecurityState;
  onClose: () => void;
  onLaunchApp: (appId: AppId) => void;
  onLockSession: () => void;
  onToggleVpn: () => void;
  onOpenFileInExplorer: (filePath: string) => void;
}

export const SL8Launcher: React.FC<SL8LauncherProps> = ({
  open,
  files,
  packages,
  security,
  onClose,
  onLaunchApp,
  onLockSession,
  onToggleVpn,
  onOpenFileInExplorer,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const allApps = useMemo(() => Object.values(APP_DEFINITIONS), []);
  const q = query.trim().toLowerCase();

  const matchedApps = useMemo(() => {
    if (!q) return allApps;
    return allApps.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.shortName.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    );
  }, [allApps, q]);

  const matchedFiles = useMemo(() => {
    if (!q) return [];
    return files
      .filter((f) => f.type === 'file' && (f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)))
      .slice(0, 4);
  }, [files, q]);

  const installedPackages = useMemo(
    () =>
      packages.filter(
        (p) =>
          p.installed &&
          (!q || p.displayName.toLowerCase().includes(q) || p.pkgName.toLowerCase().includes(q))
      ),
    [packages, q]
  );

  if (!open) return null;

  const coreApps = matchedApps.filter((a) => a.category === 'Core Suite');
  const mediaApps = matchedApps.filter((a) => a.category === 'Apps & Media');
  const systemApps = matchedApps.filter((a) => a.category === 'System & Ubuntu');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (matchedApps.length > 0) {
      onLaunchApp(matchedApps[0].id);
      onClose();
    } else if (matchedFiles.length > 0) {
      onOpenFileInExplorer(matchedFiles[0].path);
      onClose();
    }
  };

  return (
    <div
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        role="dialog"
        aria-label="SL8 Launcher"
        className="w-full max-w-[820px] rounded-none sl8-frosted-pane border border-white/15 overflow-hidden"
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.1]">
          <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--sl8-accent)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search NetCom, ZHD2, Centurion, Spotify, Steam, Calculator, or files..."
            className="flex-1 bg-transparent text-sm text-white placeholder-[#788496] focus:outline-none"
          />
          <span className="text-[11px] font-mono text-[#788496] whitespace-nowrap">ESC</span>
        </form>

        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-6">
          {coreApps.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-xs font-semibold tracking-wider text-[#94A0B2]">
                  SL8 Core Suite
                </h2>
                <span className="text-[11px] text-[#788496]">NetCom · ZHD2 · Centurion</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {coreApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => {
                      onLaunchApp(app.id);
                      onClose();
                    }}
                    className="sl8-icon-tile group p-4 rounded-none bg-white/[0.03] border border-white/[0.08] text-left"
                  >
                    <AppIcon appId={app.id} size={32} className="mb-3" />
                    <p className="font-display text-sm font-semibold text-white">{app.name}</p>
                    <p className="text-[11px] text-[#8E9AA9] mt-1 line-clamp-2 leading-relaxed">
                      {app.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mediaApps.length > 0 && (
            <div>
              <h2 className="font-display text-xs font-semibold tracking-wider text-[#94A0B2] mb-3">
                Preinstalled Applications
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {mediaApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => {
                      onLaunchApp(app.id);
                      onClose();
                    }}
                    className="sl8-icon-tile p-3 rounded-none bg-white/[0.03] border border-white/[0.08] flex flex-col items-start gap-2.5 text-left"
                  >
                    <AppIcon appId={app.id} size={28} />
                    <div className="min-w-0 w-full">
                      <p className="font-display text-xs font-semibold text-white truncate">{app.shortName}</p>
                      <p className="text-[10px] text-[#8E9AA9] truncate">{app.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {systemApps.length > 0 && (
            <div>
              <h2 className="font-display text-xs font-semibold tracking-wider text-[#94A0B2] mb-3">
                System &amp; Ubuntu Workspace
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {systemApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => {
                      onLaunchApp(app.id);
                      onClose();
                    }}
                    className="sl8-icon-tile flex items-center gap-3 p-3 rounded-none bg-white/[0.02] border border-white/[0.08] text-left"
                  >
                    <AppIcon appId={app.id} size={26} className="shrink-0" />
                    <div className="min-w-0">
                      <p className="font-display text-xs font-semibold text-white truncate">{app.shortName}</p>
                      <p className="text-[11px] text-[#7F8B9B] truncate">{app.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedFiles.length > 0 && (
            <div>
              <h2 className="font-display text-xs font-semibold tracking-wider text-[#94A0B2] mb-2">
                Matching Files
              </h2>
              <div className="space-y-1">
                {matchedFiles.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => {
                      onOpenFileInExplorer(file.path);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-none bg-white/[0.03] hover:bg-white/[0.07] text-left transition-colors"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 shrink-0" style={{ color: 'var(--sl8-accent)' }} />
                      <span className="text-xs font-medium text-white truncate">{file.name}</span>
                      <span className="text-[11px] font-mono text-[#6B7687] truncate">{file.path}</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#6B7687] shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {installedPackages.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display text-xs font-semibold tracking-wider text-[#94A0B2]">
                  Ubuntu APT &amp; Flatpak
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    onLaunchApp('packages');
                    onClose();
                  }}
                  style={{ color: 'var(--sl8-accent)' }}
                  className="text-[11px] hover:underline"
                >
                  Manage Software
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {installedPackages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => {
                      onLaunchApp('terminal');
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-none bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-[#D5DCE6] flex items-center gap-2 transition-colors"
                  >
                    <Terminal className="w-3 h-3" style={{ color: 'var(--sl8-accent)' }} />
                    <span>{pkg.displayName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-[#06080C]/90 border-t border-white/[0.1] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-[#8E9AA9]">
            <span>SL8 DSK Experimental Build</span>
            <span aria-hidden="true">·</span>
            <span>Ubuntu 26.04 Hardened</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleVpn}
              className="px-3 py-1.5 rounded-none bg-white/[0.05] hover:bg-white/[0.1] text-xs text-[#E6EAF0] flex items-center gap-1.5 whitespace-nowrap"
            >
              <Wifi className="w-3.5 h-3.5" style={{ color: 'var(--sl8-accent)' }} />
              {security.vpnEnabled ? 'Disconnect VPN' : 'Enable VPN'}
            </button>
            <button
              type="button"
              onClick={() => {
                onLaunchApp('centurion');
                onClose();
              }}
              className="px-3 py-1.5 rounded-none bg-white/[0.05] hover:bg-white/[0.1] text-xs text-[#E6EAF0] flex items-center gap-1.5 whitespace-nowrap"
            >
              <Shield className="w-3.5 h-3.5" style={{ color: 'var(--sl8-accent)' }} />
              Centurion
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onLockSession();
              }}
              style={{ backgroundColor: 'var(--sl8-accent-soft)', color: 'var(--sl8-accent)' }}
              className="px-3 py-1.5 rounded-none text-xs font-medium flex items-center gap-1.5 whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5" />
              Lock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
