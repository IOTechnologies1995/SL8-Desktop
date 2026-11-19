import React, { useMemo, useState } from 'react';
import { AppId, OSSettings, WindowInstance } from '../types/os';
import { APP_DEFINITIONS } from '../data/initialState';
import { AppIcon } from './AppIcons';

interface BottomDockProps {
  windows: WindowInstance[];
  focusedWindowId: string | null;
  launchingAppId?: AppId | null;
  settings: OSSettings;
  launcherOpen: boolean;
  onToggleLauncher: () => void;
  onDockAppClick: (appId: AppId) => void;
}

const PINNED_APPS: AppId[] = [
  'netcom',
  'zhd2',
  'centurion',
  'spotify',
  'steam',
  'calculator',
  'calendar',
  'terminal',
  'files',
  'settings',
];

export const BottomDock: React.FC<BottomDockProps> = ({
  windows,
  focusedWindowId,
  launchingAppId,
  settings,
  launcherOpen,
  onToggleLauncher,
  onDockAppClick,
}) => {
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  const [dockRevealed, setDockRevealed] = useState(false);

  const dockApps = useMemo(() => {
    const runningExtras = windows
      .map((w) => w.appId)
      .filter((id) => !PINNED_APPS.includes(id));
    return [...PINNED_APPS, ...Array.from(new Set(runningExtras))];
  }, [windows]);

  const iconSize = settings.touchMode
    ? 36
    : settings.dockSize === 'compact'
    ? 26
    : settings.dockSize === 'large'
    ? 36
    : 31;

  const buttonSize = settings.touchMode
    ? 'w-12 h-12'
    : settings.dockSize === 'compact'
    ? 'w-9 h-9'
    : settings.dockSize === 'large'
    ? 'w-12 h-12'
    : 'w-11 h-11';

  const isHorizontal = settings.dockPosition === 'bottom';

  const positionClasses =
    settings.dockPosition === 'bottom'
      ? `bottom-2.5 left-1/2 -translate-x-1/2 flex-row max-w-[96vw] ${
          settings.autoHideDock && !dockRevealed && !launcherOpen
            ? 'translate-y-[82%] opacity-60 hover:translate-y-0 hover:opacity-100'
            : 'translate-y-0 opacity-100'
        }`
      : settings.dockPosition === 'left'
      ? `left-2.5 top-1/2 -translate-y-1/2 flex-col max-h-[84vh] ${
          settings.autoHideDock && !dockRevealed && !launcherOpen
            ? '-translate-x-[82%] opacity-60 hover:translate-x-0 hover:opacity-100'
            : 'translate-x-0 opacity-100'
        }`
      : `right-2.5 top-1/2 -translate-y-1/2 flex-col max-h-[84vh] ${
          settings.autoHideDock && !dockRevealed && !launcherOpen
            ? 'translate-x-[82%] opacity-60 hover:translate-x-0 hover:opacity-100'
            : 'translate-x-0 opacity-100'
        }`;

  return (
    <nav
      aria-label="SL8 Application Dock"
      onMouseEnter={() => setDockRevealed(true)}
      onMouseLeave={() => {
        setDockRevealed(false);
        setHoveredApp(null);
      }}
      className={`fixed z-50 flex items-center gap-1.5 p-1.5 rounded-none border border-white/15 shadow-[0_18px_52px_rgba(0,0,0,0.82)] transition-transform duration-150 ${
        settings.reduceTransparency ? 'bg-[#090B10]' : 'sl8-frosted-bar'
      } ${positionClasses}`}
    >
      {/* SL8 Launcher Trigger */}
      <div className="relative flex items-center justify-center shrink-0">
        {hoveredApp === 'sl8' && !settings.touchMode && (
          <div
            style={{ borderLeftColor: 'var(--sl8-accent)' }}
            className={`pointer-events-none absolute whitespace-nowrap px-2.5 py-1 rounded-none bg-[#0B0E14]/95 border border-white/15 border-l-2 text-[11px] font-medium text-white shadow-lg z-50 ${
              isHorizontal
                ? '-top-11 left-1/2 -translate-x-1/2'
                : settings.dockPosition === 'left'
                ? 'left-14 top-1/2 -translate-y-1/2'
                : 'right-14 top-1/2 -translate-y-1/2'
            }`}
          >
            SL8 Launcher
          </div>
        )}
        <button
          type="button"
          onClick={onToggleLauncher}
          onMouseEnter={() => setHoveredApp('sl8')}
          onMouseLeave={() => setHoveredApp(null)}
          aria-label="Open SL8 Launcher"
          style={
            launcherOpen
              ? {
                  backgroundColor: 'var(--sl8-accent-soft)',
                  borderColor: 'var(--sl8-accent)',
                  boxShadow: '0 0 18px var(--sl8-accent-glow)',
                }
              : undefined
          }
          className={`sl8-icon-tile ${buttonSize} rounded-none border border-transparent flex items-center justify-center ${
            isHorizontal ? 'hover:-translate-y-1' : 'hover:scale-105'
          } focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--sl8-accent)]`}
        >
          <AppIcon appId="sl8" size={iconSize} />
        </button>
      </div>

      {/* Hairline Divider */}
      <div
        aria-hidden="true"
        className={isHorizontal ? 'w-px h-7 bg-white/15 mx-0.5 shrink-0' : 'h-px w-7 bg-white/15 my-0.5 shrink-0'}
      />

      {/* Dock Applications */}
      {dockApps.map((appId) => {
        const def = APP_DEFINITIONS[appId];
        if (!def) return null;
        const appWindows = windows.filter((w) => w.appId === appId);
        const isRunning = appWindows.length > 0;
        const isFocused = appWindows.some((w) => w.id === focusedWindowId && !w.isMinimized);
        const isLaunching = launchingAppId === appId;

        return (
          <div key={appId} className="relative flex items-center justify-center shrink-0">
            {hoveredApp === appId && !settings.touchMode && (
              <div
                style={{ borderLeftColor: 'var(--sl8-accent)' }}
                className={`pointer-events-none absolute whitespace-nowrap px-2.5 py-1 rounded-none bg-[#0B0E14]/95 border border-white/15 border-l-2 text-[11px] font-medium text-white shadow-lg z-50 ${
                  isHorizontal
                    ? '-top-11 left-1/2 -translate-x-1/2'
                    : settings.dockPosition === 'left'
                    ? 'left-14 top-1/2 -translate-y-1/2'
                    : 'right-14 top-1/2 -translate-y-1/2'
                }`}
              >
                {def.name}
              </div>
            )}

            <button
              type="button"
              onClick={() => onDockAppClick(appId)}
              onMouseEnter={() => setHoveredApp(appId)}
              onMouseLeave={() => setHoveredApp(null)}
              data-launching={isLaunching ? 'true' : undefined}
              aria-label={def.name}
              style={
                isFocused && hoveredApp !== appId && !isLaunching
                  ? { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'var(--sl8-accent-border)' }
                  : undefined
              }
              className={`sl8-icon-tile ${buttonSize} relative rounded-none border border-transparent flex items-center justify-center ${
                isHorizontal ? 'hover:-translate-y-1 hover:scale-105' : 'hover:scale-105'
              } focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--sl8-accent)]`}
            >
              <AppIcon appId={appId} size={iconSize} />

              {isRunning && (
                <span
                  aria-hidden="true"
                  style={{
                    backgroundColor: isFocused || hoveredApp === appId ? 'var(--sl8-accent)' : '#94A0B2',
                    boxShadow: isFocused || hoveredApp === appId ? '0 0 8px var(--sl8-accent)' : undefined,
                  }}
                  className={`absolute transition-all ${
                    isHorizontal
                      ? `-bottom-1 left-1/2 -translate-x-1/2 h-[2px] ${isFocused ? 'w-6' : 'w-2.5'}`
                      : settings.dockPosition === 'left'
                      ? `-left-1 top-1/2 -translate-y-1/2 w-[2px] ${isFocused ? 'h-6' : 'h-2.5'}`
                      : `-right-1 top-1/2 -translate-y-1/2 w-[2px] ${isFocused ? 'h-6' : 'h-2.5'}`
                  }`}
                />
              )}
            </button>
          </div>
        );
      })}
    </nav>
  );
};
