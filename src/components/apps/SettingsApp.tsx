import React, { useState } from 'react';
import {
  Monitor,
  PanelBottom,
  Info,
  RotateCcw,
  Check,
  Play,
  Upload,
  X,
  Clock,
  Palette,
  Fingerprint,
  Sparkles,
} from 'lucide-react';
import { OSSettings } from '../../types/os';
import { SCREENSAVER_OPTIONS, THEME_COLORS, WALLPAPERS, WEATHER_CITIES } from '../../data/initialState';
import { LiveWallpaper } from '../LiveWallpaper';

interface SettingsAppProps {
  settings: OSSettings;
  onUpdateSettings: (patch: Partial<OSSettings>) => void;
  onResetOS: () => void;
  onReplayBoot: () => void;
  onPreviewScreensaver: () => void;
}

const TIMEOUT_OPTIONS = [
  { minutes: 1, label: '1 Min' },
  { minutes: 2, label: '2 Min' },
  { minutes: 5, label: '5 Min' },
  { minutes: 10, label: '10 Min' },
  { minutes: 0, label: 'Manual' },
];

export const SettingsApp: React.FC<SettingsAppProps> = ({
  settings,
  onUpdateSettings,
  onResetOS,
  onReplayBoot,
  onPreviewScreensaver,
}) => {
  const [section, setSection] = useState<'appearance' | 'screensaver' | 'widgets' | 'dock' | 'about'>('appearance');

  const animatedWallpapers = WALLPAPERS.filter((w) => w.kind === 'animated');
  const photoWallpapers = WALLPAPERS.filter((w) => w.kind === 'photo');

  const handleUploadWallpaper = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateSettings({ customWallpaperUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="h-full flex bg-[#080A0F] text-[#E6EAF0]">
      <aside className="w-52 shrink-0 border-r border-white/[0.08] bg-[#0B0E15] p-3 space-y-1">
        <p className="px-2.5 pb-2 text-[11px] font-mono tracking-wider text-[#7F8B9B]">CONTROL CENTER</p>
        {(
          [
            { id: 'appearance', label: 'Wallpaper & Theme', icon: Palette },
            { id: 'screensaver', label: 'Screensaver', icon: Sparkles },
            { id: 'widgets', label: 'Clock, Weather & Touch', icon: Clock },
            { id: 'dock', label: 'Dock & Glass Shell', icon: PanelBottom },
            { id: 'about', label: 'Ubuntu Base & About', icon: Info },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              style={
                active
                  ? { color: 'var(--sl8-accent)', backgroundColor: 'var(--sl8-accent-soft)', borderColor: 'var(--sl8-accent)' }
                  : undefined
              }
              className={`w-full px-3 py-2.5 rounded-none border-l-2 text-left text-xs font-medium flex items-center gap-2.5 transition-colors ${
                active ? '' : 'border-transparent text-[#94A0B2] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </aside>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {section === 'appearance' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-lg font-semibold text-white">Wallpaper &amp; Theme Color</h1>
              <p className="text-xs text-[#8E9AA9] mt-0.5">
                Choose a looping animated wallpaper, pick a built-in standard photo, upload your own, or customize the theme accent.
              </p>
            </div>

            {/* Theme Color Selector */}
            <div className="p-4 rounded-none bg-[#0C1018] border border-white/[0.09] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-white">OS Theme Accent Color</p>
                  <p className="text-xs text-[#8E9AA9]">
                    Tints live wallpapers, pre-launch icon glow, dock highlights, frosted borders, and widgets.
                  </p>
                </div>
                <label className="flex items-center gap-2 px-3 py-1.5 border border-white/15 bg-[#07090D] text-xs font-mono text-white cursor-pointer">
                  <span>Custom</span>
                  <input
                    type="color"
                    value={settings.themeColor}
                    onChange={(e) => onUpdateSettings({ themeColor: e.target.value })}
                    aria-label="Custom theme color"
                    className="w-5 h-5 bg-transparent border-0 cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                {THEME_COLORS.map((c) => {
                  const selected = settings.themeColor.toLowerCase() === c.hex.toLowerCase();
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onUpdateSettings({ themeColor: c.hex })}
                      style={selected ? { borderColor: c.hex } : undefined}
                      className={`px-3 py-2 rounded-none border bg-[#07090D] text-xs flex items-center gap-2 transition-colors ${
                        selected ? 'text-white' : 'border-white/10 text-[#94A0B2] hover:text-white'
                      }`}
                    >
                      <span className="w-3 h-3 shrink-0" style={{ backgroundColor: c.hex }} />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Looping Animated Wallpapers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xs font-semibold tracking-wider text-[#B9C2CF] uppercase">
                  Looping Animated Wallpapers
                </h2>
                <span className="text-[11px] font-mono" style={{ color: 'var(--sl8-accent)' }}>
                  LIVE · THEME-SYNCED
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {animatedWallpapers.map((wp) => {
                  const selected = !settings.customWallpaperUrl && settings.wallpaperId === wp.id;
                  return (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => onUpdateSettings({ wallpaperId: wp.id, customWallpaperUrl: null })}
                      style={selected ? { borderColor: 'var(--sl8-accent)' } : undefined}
                      className={`group rounded-none overflow-hidden border text-left transition-colors ${
                        selected ? 'bg-[#0F151F]' : 'border-white/10 bg-[#0B0E15] hover:border-white/25'
                      }`}
                    >
                      <div
                        className="aspect-video w-full relative overflow-hidden bg-[#060709]"
                        style={{ backgroundImage: wp.fallbackGradient }}
                      >
                        {wp.animatedId && (
                          <LiveWallpaper
                            variant={wp.animatedId}
                            accentHex={settings.themeColor}
                            compact
                          />
                        )}
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/70 border border-white/15 text-[10px] font-mono text-white">
                          LIVE LOOP
                        </span>
                        {selected && (
                          <span
                            style={{ backgroundColor: 'var(--sl8-accent)', color: '#05080C' }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-none flex items-center justify-center"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-semibold text-white">{wp.name}</p>
                        <p className="text-[11px] text-[#8E9AA9] mt-0.5">{wp.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Wallpaper Upload Bar */}
            <div className="p-4 rounded-none bg-[#0C1018] border border-white/[0.09] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Monitor className="w-4 h-4" style={{ color: 'var(--sl8-accent)' }} />
                <div>
                  <p className="text-sm font-medium text-white">Custom Desktop Wallpaper</p>
                  <p className="text-xs text-[#8E9AA9]">
                    {settings.customWallpaperUrl
                      ? 'Custom uploaded image is active.'
                      : 'Upload any local PNG, JPG, or WebP background.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {settings.customWallpaperUrl && (
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ customWallpaperUrl: null })}
                    className="px-3 py-1.5 rounded-none border border-white/15 bg-white/[0.05] hover:bg-red-500/20 text-xs text-[#E6EAF0] flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Clear
                  </button>
                )}
                <label
                  style={{ backgroundColor: 'var(--sl8-accent)', color: '#05080C' }}
                  className="px-3.5 py-1.5 rounded-none text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                  <input type="file" accept="image/*" onChange={handleUploadWallpaper} className="hidden" />
                </label>
              </div>
            </div>

            {/* Built-In Standard Photo Wallpapers */}
            <div className="space-y-3">
              <h2 className="font-display text-xs font-semibold tracking-wider text-[#B9C2CF] uppercase">
                Built-In Standard Photo Wallpapers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {photoWallpapers.map((wp) => {
                  const selected = !settings.customWallpaperUrl && settings.wallpaperId === wp.id;
                  return (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => onUpdateSettings({ wallpaperId: wp.id, customWallpaperUrl: null })}
                      style={selected ? { borderColor: 'var(--sl8-accent)' } : undefined}
                      className={`group rounded-none overflow-hidden border text-left transition-colors ${
                        selected ? 'bg-[#0F151F]' : 'border-white/10 bg-[#0B0E15] hover:border-white/25'
                      }`}
                    >
                      <div
                        className="aspect-video w-full relative overflow-hidden bg-[#060709]"
                        style={{ backgroundImage: wp.fallbackGradient }}
                      >
                        {wp.src && (
                          <img
                            src={wp.src}
                            alt={wp.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        )}
                        {selected && (
                          <span
                            style={{ backgroundColor: 'var(--sl8-accent)', color: '#05080C' }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-none flex items-center justify-center"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-semibold text-white">{wp.name}</p>
                        <p className="text-[11px] text-[#8E9AA9] mt-0.5">{wp.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {section === 'screensaver' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-lg font-semibold text-white">OS Screensaver</h1>
                <p className="text-xs text-[#8E9AA9] mt-0.5">
                  Select a full-screen idle screensaver style and configure automatic activation delay.
                </p>
              </div>
              <button
                type="button"
                onClick={onPreviewScreensaver}
                style={{ backgroundColor: 'var(--sl8-accent)', color: '#05080C' }}
                className="px-4 py-2 rounded-none text-xs font-semibold flex items-center gap-2 hover:opacity-90"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Preview Screensaver Now</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {SCREENSAVER_OPTIONS.map((opt) => {
                const selected = settings.screensaverId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onUpdateSettings({ screensaverId: opt.id })}
                    style={selected ? { borderColor: 'var(--sl8-accent)' } : undefined}
                    className={`p-4 rounded-none border text-left transition-colors space-y-2 ${
                      selected
                        ? 'bg-[#0F1622]'
                        : 'border-white/10 bg-[#0B0E15] hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-display text-sm font-semibold text-white">{opt.name}</p>
                      {selected && (
                        <span
                          style={{ backgroundColor: 'var(--sl8-accent)', color: '#05080C' }}
                          className="w-5 h-5 flex items-center justify-center shrink-0"
                        >
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#8E9AA9] leading-relaxed">{opt.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-none bg-[#0C1018] border border-white/[0.09] flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Idle Activation Timer</p>
                <p className="text-xs text-[#8E9AA9]">
                  Launch the screensaver automatically after inactivity, or set to Manual Only.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1 p-1 bg-[#06080C] border border-white/[0.08]">
                {TIMEOUT_OPTIONS.map((t) => {
                  const active = settings.screensaverTimeoutMin === t.minutes;
                  return (
                    <button
                      key={t.minutes}
                      type="button"
                      onClick={() => onUpdateSettings({ screensaverTimeoutMin: t.minutes })}
                      style={
                        active
                          ? { color: 'var(--sl8-accent)', backgroundColor: 'var(--sl8-accent-soft)' }
                          : undefined
                      }
                      className={`px-3 py-1.5 rounded-none text-xs font-mono transition-colors ${
                        active ? '' : 'text-[#94A0B2] hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {section === 'widgets' && (
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-lg font-semibold text-white">Desktop Clock, Weather &amp; Touch</h1>
              <p className="text-xs text-[#8E9AA9] mt-0.5">
                Configure frosted glass desktop indicators and touch screen device ergonomics.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-none bg-[#0C1018] border border-white/[0.09] flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">Desktop Digital Clock</p>
                  <p className="text-xs text-[#8E9AA9]">Display the frosted glass time &amp; date pane on the desktop.</p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ showDesktopClock: !settings.showDesktopClock })}
                  style={
                    settings.showDesktopClock
                      ? { backgroundColor: 'var(--sl8-accent)', color: '#05080C' }
                      : undefined
                  }
                  className={`px-3.5 py-1.5 rounded-none text-xs font-mono font-semibold ${
                    settings.showDesktopClock ? '' : 'bg-white/[0.07] text-[#E6EAF0]'
                  }`}
                >
                  {settings.showDesktopClock ? 'SHOWN' : 'HIDDEN'}
                </button>
              </div>

              <div className="p-4 rounded-none bg-[#0C1018] border border-white/[0.09] flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">Clock Format</p>
                  <p className="text-xs text-[#8E9AA9]">Choose between 24-hour military time or 12-hour AM/PM.</p>
                </div>
                <div className="flex items-center gap-1 p-1 bg-[#06080C] border border-white/[0.08]">
                  {(
                    [
                      { val: true, label: '24H' },
                      { val: false, label: '12H' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => onUpdateSettings({ clock24Hour: opt.val })}
                      style={
                        settings.clock24Hour === opt.val
                          ? { color: 'var(--sl8-accent)', backgroundColor: 'var(--sl8-accent-soft)' }
                          : undefined
                      }
                      className={`px-3 py-1 rounded-none text-xs font-mono ${
                        settings.clock24Hour === opt.val ? '' : 'text-[#94A0B2] hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-none bg-[#0C1018] border border-white/[0.09] flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">Desktop Weather Indicator</p>
                  <p className="text-xs text-[#8E9AA9]">Live temperature, sky condition, wind, and humidity pane.</p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ showDesktopWeather: !settings.showDesktopWeather })}
                  style={
                    settings.showDesktopWeather
                      ? { backgroundColor: 'var(--sl8-accent)', color: '#05080C' }
                      : undefined
                  }
                  className={`px-3.5 py-1.5 rounded-none text-xs font-mono font-semibold ${
                    settings.showDesktopWeather ? '' : 'bg-white/[0.07] text-[#E6EAF0]'
                  }`}
                >
                  {settings.showDesktopWeather ? 'SHOWN' : 'HIDDEN'}
                </button>
              </div>

              <div className="p-4 rounded-none bg-[#0C1018] border border-white/[0.09] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">Weather Location &amp; Unit</p>
                  <p className="text-xs text-[#8E9AA9]">Select city forecast and temperature scale.</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={settings.weatherCity}
                    onChange={(e) => onUpdateSettings({ weatherCity: e.target.value })}
                    className="px-3 py-1.5 rounded-none bg-[#06080C] border border-white/12 text-xs font-mono text-white focus:outline-none"
                  >
                    {WEATHER_CITIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ weatherUnit: settings.weatherUnit === 'F' ? 'C' : 'F' })
                    }
                    className="px-3 py-1.5 rounded-none bg-[#06080C] border border-white/12 text-xs font-mono text-white"
                  >
                    °{settings.weatherUnit}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-none bg-[#0C1018] border border-white/[0.09] flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Fingerprint className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--sl8-accent)' }} />
                  <div>
                    <p className="text-sm font-medium text-white">Touch Screen Mode</p>
                    <p className="text-xs text-[#8E9AA9]">
                      Enlarges window title controls, resize handles, dock icons, and enables swipe gestures.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ touchMode: !settings.touchMode })}
                  style={
                    settings.touchMode
                      ? { backgroundColor: 'var(--sl8-accent)', color: '#05080C' }
                      : undefined
                  }
                  className={`px-3.5 py-1.5 rounded-none text-xs font-mono font-semibold shrink-0 ${
                    settings.touchMode ? '' : 'bg-white/[0.07] text-[#E6EAF0]'
                  }`}
                >
                  {settings.touchMode ? 'TOUCH ON' : 'STANDARD'}
                </button>
              </div>
            </div>
          </div>
        )}

        {section === 'dock' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-lg font-semibold text-white">Dock &amp; Glass Shell</h1>
              <p className="text-xs text-[#8E9AA9] mt-0.5">
                Sharp rectangular frosted glass surfaces anchored with a bottom dock by default.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-none bg-[#0C1018] border border-white/[0.09] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">Dock Screen Edge</p>
                  <p className="text-xs text-[#8E9AA9]">Choose where the SL8 application dock sits.</p>
                </div>
                <div className="flex items-center gap-1 p-1 rounded-none bg-[#06080C] border border-white/[0.08]">
                  {(['bottom', 'left', 'right'] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => onUpdateSettings({ dockPosition: pos })}
                      style={
                        settings.dockPosition === pos
                          ? { color: 'var(--sl8-accent)', backgroundColor: 'var(--sl8-accent-soft)' }
                          : undefined
                      }
                      className={`px-3 py-1.5 rounded-none text-xs font-medium capitalize transition-colors ${
                        settings.dockPosition === pos ? '' : 'text-[#94A0B2] hover:text-white'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-none bg-[#0C1018] border border-white/[0.09] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">Dock Icon Scale</p>
                  <p className="text-xs text-[#8E9AA9]">Adjust dock footprint across screen resolutions.</p>
                </div>
                <div className="flex items-center gap-1 p-1 rounded-none bg-[#06080C] border border-white/[0.08]">
                  {(['compact', 'standard', 'large'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => onUpdateSettings({ dockSize: sz })}
                      style={
                        settings.dockSize === sz
                          ? { color: 'var(--sl8-accent)', backgroundColor: 'var(--sl8-accent-soft)' }
                          : undefined
                      }
                      className={`px-3 py-1.5 rounded-none text-xs font-medium capitalize transition-colors ${
                        settings.dockSize === sz ? '' : 'text-[#94A0B2] hover:text-white'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-none bg-[#0C1018] border border-white/[0.09] flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">Auto-Hide Dock</p>
                  <p className="text-xs text-[#8E9AA9]">Recess the dock when idle and reveal on hover.</p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ autoHideDock: !settings.autoHideDock })}
                  style={
                    settings.autoHideDock
                      ? { backgroundColor: 'var(--sl8-accent)', color: '#05080C' }
                      : undefined
                  }
                  className={`px-3.5 py-1.5 rounded-none text-xs font-mono font-semibold ${
                    settings.autoHideDock ? '' : 'bg-white/[0.07] text-[#E6EAF0]'
                  }`}
                >
                  {settings.autoHideDock ? 'AUTO-HIDE' : 'PINNED'}
                </button>
              </div>

              <div className="p-4 rounded-none bg-[#0C1018] border border-white/[0.09] flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">Frosted Glass Compositor</p>
                  <p className="text-xs text-[#8E9AA9]">
                    Toggle frosted glass transparency on window title bars and the top status bar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ reduceTransparency: !settings.reduceTransparency })}
                  style={
                    !settings.reduceTransparency
                      ? { backgroundColor: 'var(--sl8-accent)', color: '#05080C' }
                      : undefined
                  }
                  className={`px-3.5 py-1.5 rounded-none text-xs font-mono font-semibold ${
                    !settings.reduceTransparency ? '' : 'bg-white/[0.07] text-[#E6EAF0]'
                  }`}
                >
                  {settings.reduceTransparency ? 'SOLID' : 'FROSTED'}
                </button>
              </div>
            </div>
          </div>
        )}

        {section === 'about' && (
          <div className="space-y-6">
            <div className="p-4 rounded-none bg-[#0C1018] border border-white/[0.09] flex items-center gap-4">
              <div className="w-16 h-16 shrink-0 bg-[#030407] border border-white/15 flex items-center justify-center p-1">
                <img
                  src="./assets/aistudio/SL8Future_c112cf52.png"
                  alt="SL8 OS Official Logo"
                  className="w-full h-full object-contain mix-blend-screen"
                />
              </div>
              <div>
                <h1 className="font-display text-lg font-semibold text-white">SL8 DSK Experimental Build</h1>
                <p className="text-xs text-[#8E9AA9] mt-0.5">
                  SL8 Desktop OS — Privacy-first Linux distribution built on Ubuntu 26.04 LTS.
                </p>
              </div>
            </div>

            <div className="divide-y divide-white/[0.06] border border-white/[0.09] rounded-none bg-[#0B0E15] overflow-hidden text-xs">
              {[
                ['Build String', 'SL8 DSK Experimental Build (26.04-exp)'],
                ['Upstream Base', 'Ubuntu 26.04 LTS · Zero-Telemetry Hardened Core'],
                ['Linux Kernel', '6.12.8-sl8-hardened x86_64'],
                ['Security Core', 'Centurion (nftables + WireGuard + AppArmor)'],
                ['Display Compositor', 'SL8 Sharp Frosted Glass Wayland Shell'],
                ['Preinstalled Suite', 'NetCom · ZHD2 · Centurion · Spotify · Steam · Calculator · Calendar'],
                ['Host Identity', `${settings.username}@${settings.hostname}`],
              ].map(([k, v]) => (
                <div key={k} className="px-4 py-3 flex items-center justify-between gap-4">
                  <span className="text-[#8E9AA9]">{k}</span>
                  <span className="font-mono text-white text-right">{v}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-none bg-[#0C1018] border border-white/[0.09] flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">Boot Animation</p>
                  <p className="text-xs text-[#8E9AA9]">Replay &ldquo;Your Personal Gateway Experience&rdquo;</p>
                </div>
                <button
                  type="button"
                  onClick={onReplayBoot}
                  style={{ backgroundColor: 'var(--sl8-accent)', color: '#05080C' }}
                  className="px-3.5 py-2 rounded-none text-xs font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-90 whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5" />
                  Replay
                </button>
              </div>

              <div className="p-4 rounded-none bg-[#0C1018] border border-white/[0.09] flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">Reset Workspace</p>
                  <p className="text-xs text-[#8E9AA9]">Restore defaults</p>
                </div>
                <button
                  type="button"
                  onClick={onResetOS}
                  className="px-3.5 py-2 rounded-none bg-white/[0.07] hover:bg-red-500/20 hover:text-red-300 text-xs font-medium text-white flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
