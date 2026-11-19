/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  AppId,
  BrowserShieldSettings,
  CalendarEvent,
  DesktopNote,
  MediaTrack,
  OSSettings,
  SecurityState,
  UbuntuPackage,
  VirtualFile,
  WifiState,
  WindowInstance,
} from './types/os';
import {
  APP_DEFINITIONS,
  INITIAL_BROWSER_SHIELD,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_FILES,
  INITIAL_MEDIA_TRACKS,
  INITIAL_NOTES,
  INITIAL_PACKAGES,
  INITIAL_SECURITY,
  INITIAL_SETTINGS,
  INITIAL_WIFI,
  WALLPAPERS,
} from './data/initialState';
import { BootSequence } from './components/BootSequence';
import { TopBar } from './components/TopBar';
import { BottomDock } from './components/BottomDock';
import { WindowFrame } from './components/WindowFrame';
import { SL8Launcher } from './components/SL8Launcher';
import { LockScreen } from './components/LockScreen';
import { DesktopWidgets } from './components/DesktopWidgets';
import { LiveWallpaper } from './components/LiveWallpaper';
import { ScreensaverOverlay } from './components/ScreensaverOverlay';
import { AppIcon } from './components/AppIcons';
import { NetcomApp } from './components/apps/NetcomApp';
import { ZHD2App } from './components/apps/ZHD2App';
import { CenturionApp } from './components/apps/CenturionApp';
import { SpotifyApp } from './components/apps/SpotifyApp';
import { SteamApp } from './components/apps/SteamApp';
import { CalculatorApp } from './components/apps/CalculatorApp';
import { CalendarApp } from './components/apps/CalendarApp';
import { NotesApp } from './components/apps/NotesApp';
import { TerminalApp } from './components/apps/TerminalApp';
import { FilesApp } from './components/apps/FilesApp';
import { PackagesApp } from './components/apps/PackagesApp';
import { SettingsApp } from './components/apps/SettingsApp';

const STORAGE_KEY = 'sl8_desktop_os_v5';

function loadSavedState<T>(field: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed[field] === undefined) return fallback;
    if (typeof fallback === 'object' && fallback !== null && !Array.isArray(fallback)) {
      return { ...fallback, ...(parsed[field] as object) } as T;
    }
    return parsed[field] as T;
  } catch {
    return fallback;
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 229;
  const b = parseInt(full.slice(4, 6), 16) || 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function createInitialWindows(): WindowInstance[] {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
  const winW = Math.min(860, vw - 140);
  const winH = Math.min(560, vh - 170);

  return [
    {
      id: 'win-netcom-init',
      appId: 'netcom',
      title: APP_DEFINITIONS.netcom.name,
      x: Math.max(118, Math.round((vw - winW) / 2) - 48),
      y: Math.max(54, Math.round((vh - winH) / 2) - 14),
      width: winW,
      height: winH,
      isMinimized: false,
      isMaximized: false,
      zIndex: 12,
    },
  ];
}

const DESKTOP_SHORTCUTS: AppId[] = ['netcom', 'zhd2', 'centurion', 'spotify', 'steam', 'calculator'];

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [settings, setSettings] = useState<OSSettings>(() => loadSavedState('settings', INITIAL_SETTINGS));
  const [security, setSecurity] = useState<SecurityState>(() => loadSavedState('security', INITIAL_SECURITY));
  const [wifi, setWifi] = useState<WifiState>(() => loadSavedState('wifi', INITIAL_WIFI));
  const [files, setFiles] = useState<VirtualFile[]>(() => loadSavedState('files', INITIAL_FILES));
  const [packages, setPackages] = useState<UbuntuPackage[]>(() =>
    loadSavedState('packages', INITIAL_PACKAGES)
  );
  const [browserShield, setBrowserShield] = useState<BrowserShieldSettings>(() =>
    loadSavedState('browserShield', INITIAL_BROWSER_SHIELD)
  );
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() =>
    loadSavedState('calendarEvents', INITIAL_CALENDAR_EVENTS)
  );
  const [notes, setNotes] = useState<DesktopNote[]>(() => loadSavedState('notes', INITIAL_NOTES));
  const [mediaTracks, setMediaTracks] = useState<MediaTrack[]>(INITIAL_MEDIA_TRACKS);

  const [windows, setWindows] = useState<WindowInstance[]>(createInitialWindows);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>('win-netcom-init');
  const [topZ, setTopZ] = useState(14);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [screensaverActive, setScreensaverActive] = useState(false);
  const [launchingAppId, setLaunchingAppId] = useState<AppId | null>(null);
  const [explorerPreselectPath, setExplorerPreselectPath] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const launchTimerRef = useRef<number | null>(null);

  // Sync dynamic OS accent theme color to CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    const hex = settings.themeColor || '#00E5FF';
    root.style.setProperty('--sl8-accent', hex);
    root.style.setProperty('--sl8-accent-soft', hexToRgba(hex, 0.16));
    root.style.setProperty('--sl8-accent-border', hexToRgba(hex, 0.5));
    root.style.setProperty('--sl8-accent-glow', hexToRgba(hex, 0.54));
  }, [settings.themeColor]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          settings,
          security,
          wifi,
          files,
          packages,
          browserShield,
          calendarEvents,
          notes,
        })
      );
    } catch {
      // Ignore storage quota issues (e.g., very large custom wallpapers)
    }
  }, [settings, security, wifi, files, packages, browserShield, calendarEvents, notes]);

  // Cleanup any pending pre-launch glow timer on unmount
  useEffect(() => {
    return () => {
      if (launchTimerRef.current !== null) {
        window.clearTimeout(launchTimerRef.current);
      }
    };
  }, []);

  // OS Idle Screensaver Activation Timer
  useEffect(() => {
    if (isBooting || isLocked || screensaverActive || settings.screensaverTimeoutMin <= 0) {
      return;
    }
    const timeoutMs = settings.screensaverTimeoutMin * 60 * 1000;
    let idleTimer = window.setTimeout(() => setScreensaverActive(true), timeoutMs);

    const resetIdle = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => setScreensaverActive(true), timeoutMs);
    };

    const events: Array<keyof WindowEventMap> = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, resetIdle, { passive: true }));
    return () => {
      window.clearTimeout(idleTimer);
      events.forEach((ev) => window.removeEventListener(ev, resetIdle));
    };
  }, [isBooting, isLocked, screensaverActive, settings.screensaverTimeoutMin]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'Space') {
        e.preventDefault();
        setLauncherOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const activeWallpaper = useMemo(
    () => WALLPAPERS.find((w) => w.id === settings.wallpaperId) ?? WALLPAPERS[0],
    [settings.wallpaperId]
  );

  const focusedWindow = windows.find((w) => w.id === focusedWindowId && !w.isMinimized) ?? null;

  const focusWindow = useCallback((id: string) => {
    setTopZ((z) => {
      const nextZ = z + 1;
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, zIndex: nextZ, isMinimized: false } : w))
      );
      return nextZ;
    });
    setFocusedWindowId(id);
    setContextMenu(null);
  }, []);

  const openOrFocusApp = useCallback(
    (appId: AppId) => {
      setContextMenu(null);
      const existing = windows.find((w) => w.appId === appId);
      if (existing) {
        focusWindow(existing.id);
        return;
      }

      const def = APP_DEFINITIONS[appId];
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const offset = (windows.length % 5) * 26;
      const width = Math.min(def.defaultWidth, vw - 36);
      const height = Math.min(def.defaultHeight, vh - 138);
      const x = Math.max(18, Math.min(vw - width - 18, Math.round((vw - width) / 2) + offset - 20));
      const y = Math.max(48, Math.min(vh - height - 92, Math.round((vh - height) / 2) + offset - 28));

      const id = `win-${appId}-${Date.now()}`;
      setTopZ((z) => {
        const nextZ = z + 1;
        setWindows((prev) => [
          ...prev,
          {
            id,
            appId,
            title: def.name,
            x,
            y,
            width,
            height,
            isMinimized: false,
            isMaximized: false,
            zIndex: nextZ,
          },
        ]);
        return nextZ;
      });
      setFocusedWindowId(id);
    },
    [windows, focusWindow]
  );

  // Pulses the icon with the user's chosen theme color glow before launching an unopened app
  const launchAppWithGlow = useCallback(
    (appId: AppId) => {
      setContextMenu(null);
      const existing = windows.find((w) => w.appId === appId);
      if (existing) {
        focusWindow(existing.id);
        return;
      }
      if (launchTimerRef.current !== null) {
        window.clearTimeout(launchTimerRef.current);
      }
      setLaunchingAppId(appId);
      launchTimerRef.current = window.setTimeout(() => {
        setLaunchingAppId(null);
        openOrFocusApp(appId);
      }, 170);
    },
    [windows, focusWindow, openOrFocusApp]
  );

  const handleDockAppClick = useCallback(
    (appId: AppId) => {
      setLauncherOpen(false);
      const existing = windows.find((w) => w.appId === appId);
      if (!existing) {
        launchAppWithGlow(appId);
        return;
      }
      if (existing.id === focusedWindowId && !existing.isMinimized) {
        setWindows((prev) =>
          prev.map((w) => (w.id === existing.id ? { ...w, isMinimized: true } : w))
        );
        setFocusedWindowId(null);
      } else {
        focusWindow(existing.id);
      }
    },
    [windows, focusedWindowId, launchAppWithGlow, focusWindow]
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setFocusedWindowId((cur) => (cur === id ? null : cur));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)));
    setFocusedWindowId((cur) => (cur === id ? null : cur));
  }, []);

  const toggleMaximizeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w)));
  }, []);

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));
  }, []);

  const resizeWindow = useCallback((id: string, width: number, height: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, width, height } : w)));
  }, []);

  const createVirtualFile = useCallback(
    (parentPath: string, name: string, type: 'file' | 'folder', content = '') => {
      const cleanName = name.replace(/\//g, '');
      if (!cleanName) return;
      const fullPath = `${parentPath === '/' ? '' : parentPath}/${cleanName}`;
      setFiles((prev) => {
        if (prev.some((f) => f.path === fullPath)) return prev;
        return [
          ...prev,
          {
            id: `vf-${Date.now()}-${Math.random()}`,
            name: cleanName,
            path: fullPath,
            parentPath,
            type,
            content: type === 'file' ? content : undefined,
            encrypted: false,
            sizeBytes: type === 'folder' ? 4096 : new Blob([content]).size,
            updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            permissions: type === 'folder' ? 'drwx------' : '-rw-------',
          },
        ];
      });
    },
    []
  );

  const updateVirtualFile = useCallback((path: string, patch: Partial<VirtualFile>) => {
    setFiles((prev) => prev.map((f) => (f.path === path ? { ...f, ...patch } : f)));
  }, []);

  const deleteVirtualFile = useCallback((path: string) => {
    setFiles((prev) => prev.filter((f) => f.path !== path && !f.path.startsWith(`${path}/`)));
  }, []);

  const handleOpenFileInExplorer = useCallback(
    (filePath: string) => {
      setExplorerPreselectPath(filePath);
      openOrFocusApp('files');
    },
    [openOrFocusApp]
  );

  const handleCreateNote = useCallback((): DesktopNote => {
    const fresh: DesktopNote = {
      id: `note-${Date.now()}`,
      title: 'Untitled Note',
      body: '',
      updatedAt: 'Just now',
    };
    setNotes((prev) => [fresh, ...prev]);
    return fresh;
  }, []);

  const handleResetOS = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings(INITIAL_SETTINGS);
    setSecurity(INITIAL_SECURITY);
    setWifi(INITIAL_WIFI);
    setFiles(INITIAL_FILES);
    setPackages(INITIAL_PACKAGES);
    setBrowserShield(INITIAL_BROWSER_SHIELD);
    setCalendarEvents(INITIAL_CALENDAR_EVENTS);
    setNotes(INITIAL_NOTES);
    setMediaTracks(INITIAL_MEDIA_TRACKS);
    setWindows(createInitialWindows());
    setFocusedWindowId('win-netcom-init');
  }, []);

  const renderAppContent = (appId: AppId) => {
    switch (appId) {
      case 'netcom':
        return (
          <NetcomApp
            security={security}
            shield={browserShield}
            onUpdateShield={setBrowserShield}
            onOpenCenturion={() => openOrFocusApp('centurion')}
          />
        );
      case 'zhd2':
        return (
          <ZHD2App
            tracks={mediaTracks}
            onAddTracks={(added) => setMediaTracks((prev) => [...added, ...prev])}
          />
        );
      case 'centurion':
        return <CenturionApp security={security} onUpdateSecurity={setSecurity} />;
      case 'spotify':
        return <SpotifyApp />;
      case 'steam':
        return <SteamApp />;
      case 'calculator':
        return <CalculatorApp />;
      case 'calendar':
        return (
          <CalendarApp
            events={calendarEvents}
            onAddEvent={(ev) => setCalendarEvents((prev) => [...prev, ev])}
            onDeleteEvent={(id) => setCalendarEvents((prev) => prev.filter((e) => e.id !== id))}
          />
        );
      case 'notes':
        return (
          <NotesApp
            notes={notes}
            onCreateNote={handleCreateNote}
            onUpdateNote={(id, patch) =>
              setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)))
            }
            onDeleteNote={(id) => setNotes((prev) => prev.filter((n) => n.id !== id))}
          />
        );
      case 'terminal':
        return (
          <TerminalApp
            files={files}
            security={security}
            settings={settings}
            packages={packages}
            onCreateFile={createVirtualFile}
            onDeleteFile={deleteVirtualFile}
            onLaunchApp={openOrFocusApp}
          />
        );
      case 'files':
        return (
          <FilesApp
            files={files}
            initialSelectedPath={explorerPreselectPath}
            onCreateFile={createVirtualFile}
            onUpdateFile={updateVirtualFile}
            onDeleteFile={deleteVirtualFile}
            onOpenZHD2={() => openOrFocusApp('zhd2')}
          />
        );
      case 'packages':
        return (
          <PackagesApp
            packages={packages}
            onToggleInstall={(id) =>
              setPackages((prev) =>
                prev.map((p) => (p.id === id ? { ...p, installed: !p.installed } : p))
              )
            }
          />
        );
      case 'settings':
        return (
          <SettingsApp
            settings={settings}
            onUpdateSettings={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
            onResetOS={handleResetOS}
            onReplayBoot={() => setIsBooting(true)}
            onPreviewScreensaver={() => setScreensaverActive(true)}
          />
        );
    }
  };

  const showAnimatedWallpaper =
    !settings.customWallpaperUrl && activeWallpaper.kind === 'animated' && activeWallpaper.animatedId;
  const photoWallpaperSrc = settings.customWallpaperUrl || activeWallpaper.src;

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-[#060709] select-none"
      style={{ filter: `brightness(${settings.brightness}%)` }}
      onClick={() => setContextMenu(null)}
      onContextMenu={(e) => {
        if ((e.target as HTMLElement).dataset.desktopCanvas === 'true') {
          e.preventDefault();
          setContextMenu({
            x: Math.min(e.clientX, window.innerWidth - 220),
            y: Math.min(e.clientY, window.innerHeight - 310),
          });
        }
      }}
    >
      {/* Pre-Boot Animation: "Your Personal Gateway Experience" */}
      <BootSequence visible={isBooting} onComplete={() => setIsBooting(false)} />

      {/* Wallpaper Canvas (Looping Animated Default + Animated Variants + Built-In Photos + Custom Upload) */}
      <div
        data-desktop-canvas="true"
        className="absolute inset-0 bg-[#060709]"
        style={{ backgroundImage: activeWallpaper.fallbackGradient }}
      >
        {showAnimatedWallpaper && activeWallpaper.animatedId ? (
          <LiveWallpaper
            variant={activeWallpaper.animatedId}
            accentHex={settings.themeColor}
            isDesktopCanvas
          />
        ) : (
          photoWallpaperSrc && (
            <img
              src={photoWallpaperSrc}
              alt={settings.customWallpaperUrl ? 'Custom Desktop Wallpaper' : activeWallpaper.name}
              referrerPolicy="no-referrer"
              data-desktop-canvas="true"
              className="w-full h-full object-cover pointer-events-none select-none"
            />
          )
        )}
        <div
          data-desktop-canvas="true"
          className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/45"
        />
      </div>

      {/* Frosted Glass Top Status Bar ("SL8 DSK Experimental Build") */}
      <TopBar
        activeAppTitle={focusedWindow ? focusedWindow.title : 'SL8 Desktop OS'}
        security={security}
        settings={settings}
        wifi={wifi}
        launcherOpen={launcherOpen}
        onToggleLauncher={() => setLauncherOpen((v) => !v)}
        onOpenApp={openOrFocusApp}
        onToggleVpn={() => setSecurity((prev) => ({ ...prev, vpnEnabled: !prev.vpnEnabled }))}
        onToggleKillSwitch={(key) =>
          setSecurity((prev) => ({
            ...prev,
            killSwitches: { ...prev.killSwitches, [key]: !prev.killSwitches[key] },
          }))
        }
        onToggleMacRandomize={() =>
          setSecurity((prev) => ({
            ...prev,
            kernelHardening: {
              ...prev.kernelHardening,
              macRandomize: !prev.kernelHardening.macRandomize,
            },
          }))
        }
        onUpdateWifi={setWifi}
        onUpdateSettings={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
        onStartScreensaver={() => setScreensaverActive(true)}
        onLockSession={() => {
          setLauncherOpen(false);
          setIsLocked(true);
        }}
        onReplayBoot={() => setIsBooting(true)}
      />

      {/* Desktop Canvas Shortcuts + Frosted Clock & Weather Widgets */}
      <main data-desktop-canvas="true" className="relative z-10 w-full h-full pt-[52px] pb-[92px] px-5">
        <div className="inline-flex flex-col gap-1.5">
          {DESKTOP_SHORTCUTS.map((appId) => {
            const def = APP_DEFINITIONS[appId];
            return (
              <button
                key={appId}
                type="button"
                onClick={() => launchAppWithGlow(appId)}
                data-launching={launchingAppId === appId ? 'true' : undefined}
                className={`sl8-icon-tile group ${
                  settings.touchMode ? 'w-24 py-3' : 'w-20 py-2.5'
                } px-2 rounded-none flex flex-col items-center gap-1.5 border border-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--sl8-accent)]`}
              >
                <AppIcon appId={appId} size={settings.touchMode ? 38 : 34} />
                <span className="text-[11px] font-medium text-[#E6EAF0] group-hover:text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] whitespace-nowrap">
                  {def.shortName}
                </span>
              </button>
            );
          })}
        </div>

        <DesktopWidgets
          settings={settings}
          onUpdateSettings={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
          onOpenCalendar={() => openOrFocusApp('calendar')}
        />

        {/* Quiet Desktop Build Watermark */}
        <div className="hidden lg:block fixed right-6 bottom-5 z-0 text-right pointer-events-none">
          <p className="font-display text-xs font-semibold tracking-wider text-white/75">
            SL8 DSK Experimental Build
          </p>
          <p className="text-[10px] font-mono text-[#94A0B2]/75">
            Ubuntu 26.04 LTS · Centurion Core
          </p>
        </div>
      </main>

      {/* Active Window Layer with Open / Close / Minimize / Maximize Animations */}
      <AnimatePresence>
        {windows.map((win) => (
          <WindowFrame
            key={win.id}
            win={win}
            isFocused={focusedWindowId === win.id}
            reduceTransparency={settings.reduceTransparency}
            dockPosition={settings.dockPosition}
            touchMode={settings.touchMode}
            onFocus={focusWindow}
            onClose={closeWindow}
            onMinimize={minimizeWindow}
            onToggleMaximize={toggleMaximizeWindow}
            onMove={moveWindow}
            onResize={resizeWindow}
          >
            {renderAppContent(win.appId)}
          </WindowFrame>
        ))}
      </AnimatePresence>

      {/* Sharp Rectangular Desktop Right-Click Context Menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-56 rounded-none sl8-frosted-pane border border-white/15 shadow-2xl p-1 text-xs"
        >
          {[
            { label: 'Open SL8 Launcher', action: () => setLauncherOpen(true) },
            { label: 'Open NetCom Browser', action: () => openOrFocusApp('netcom') },
            { label: 'Open ZHD2 Media Player', action: () => openOrFocusApp('zhd2') },
            { label: 'Open Centurion', action: () => openOrFocusApp('centurion') },
            { label: 'Customize Wallpaper & Theme', action: () => openOrFocusApp('settings') },
            { label: 'Start Screensaver', action: () => setScreensaverActive(true) },
            { label: 'Open SL8 Terminal', action: () => openOrFocusApp('terminal') },
            { label: 'Replay Boot Animation', action: () => setIsBooting(true) },
            { label: 'Lock Session', action: () => setIsLocked(true) },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setContextMenu(null);
                item.action();
              }}
              className="w-full px-3 py-2 rounded-none text-left text-[#E6EAF0] hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Default Bottom Sharp Glass Dock */}
      <BottomDock
        windows={windows}
        focusedWindowId={focusedWindowId}
        launchingAppId={launchingAppId}
        settings={settings}
        launcherOpen={launcherOpen}
        onToggleLauncher={() => setLauncherOpen((v) => !v)}
        onDockAppClick={handleDockAppClick}
      />

      {/* SL8 Launcher Overlay */}
      <SL8Launcher
        open={launcherOpen}
        files={files}
        packages={packages}
        security={security}
        onClose={() => setLauncherOpen(false)}
        onLaunchApp={openOrFocusApp}
        onLockSession={() => setIsLocked(true)}
        onToggleVpn={() => setSecurity((prev) => ({ ...prev, vpnEnabled: !prev.vpnEnabled }))}
        onOpenFileInExplorer={handleOpenFileInExplorer}
      />

      {/* OS Screensaver Overlay */}
      <ScreensaverOverlay
        active={screensaverActive}
        variant={settings.screensaverId}
        accentHex={settings.themeColor}
        clock24Hour={settings.clock24Hour}
        onDismiss={() => setScreensaverActive(false)}
      />

      {/* Lock Screen */}
      <LockScreen
        locked={isLocked}
        wallpaper={activeWallpaper}
        settings={settings}
        security={security}
        onUnlock={() => setIsLocked(false)}
      />
    </div>
  );
}
