import React, { useState } from 'react';
import { Play, Square, Download, Trash2, Cpu, Shield, Users, Sparkles } from 'lucide-react';

interface SteamGame {
  id: string;
  title: string;
  developer: string;
  runtime: 'Linux Native' | 'Proton 9.0' | 'Proton Experimental';
  hours: number;
  sizeGb: string;
  installed: boolean;
  shaderStatus: string;
  genre: string;
}

const INITIAL_GAMES: SteamGame[] = [
  {
    id: 'gm-1',
    title: 'Cyberpunk 2077',
    developer: 'CD PROJEKT RED',
    runtime: 'Proton 9.0',
    hours: 64.2,
    sizeGb: '72.4 GB',
    installed: true,
    shaderStatus: 'Vulkan DXVK Cache Ready',
    genre: 'Open-World RPG',
  },
  {
    id: 'gm-2',
    title: 'Hades II',
    developer: 'Supergiant Games',
    runtime: 'Proton Experimental',
    hours: 28.5,
    sizeGb: '8.6 GB',
    installed: true,
    shaderStatus: 'Vulkan Pipeline Synced',
    genre: 'Roguelike Action',
  },
  {
    id: 'gm-3',
    title: 'Hollow Knight',
    developer: 'Team Cherry',
    runtime: 'Linux Native',
    hours: 41.0,
    sizeGb: '7.4 GB',
    installed: true,
    shaderStatus: 'OpenGL / Wayland Native',
    genre: 'Metroidvania',
  },
  {
    id: 'gm-4',
    title: 'Portal 2',
    developer: 'Valve',
    runtime: 'Linux Native',
    hours: 19.8,
    sizeGb: '11.2 GB',
    installed: true,
    shaderStatus: 'Vulkan Native Ready',
    genre: 'First-Person Puzzle',
  },
  {
    id: 'gm-5',
    title: 'Deep Rock Galactic',
    developer: 'Ghost Ship Games',
    runtime: 'Proton 9.0',
    hours: 33.4,
    sizeGb: '3.2 GB',
    installed: false,
    shaderStatus: 'Pending Install',
    genre: 'Co-op FPS',
  },
  {
    id: 'gm-6',
    title: 'Celeste',
    developer: 'Maddy Makes Games',
    runtime: 'Linux Native',
    hours: 14.6,
    sizeGb: '1.2 GB',
    installed: false,
    shaderStatus: 'Pending Install',
    genre: 'Precision Platformer',
  },
];

const STORE_HIGHLIGHTS = [
  { title: 'Balatro', price: '$14.99', tag: 'Steam Deck Verified · Native', discount: '-15%' },
  { title: 'Control Ultimate Edition', price: '$9.99', tag: 'Proton Gold · DX12 Vulkan', discount: '-75%' },
  { title: 'Factorio: Space Age', price: '$35.00', tag: 'Ubuntu Native · 64-bit', discount: 'NEW' },
  { title: 'Disco Elysium', price: '$11.99', tag: 'Proton Platinum', discount: '-70%' },
];

export const SteamApp: React.FC = () => {
  const [tab, setTab] = useState<'library' | 'store'>('library');
  const [games, setGames] = useState<SteamGame[]>(INITIAL_GAMES);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_GAMES[0].id);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [protonOverride, setProtonOverride] = useState<string>('Proton 9.0-4 (Vulkan)');

  const selectedGame = games.find((g) => g.id === selectedId) ?? games[0];

  const handleToggleInstall = (id: string) => {
    setBusyId(id);
    setTimeout(() => {
      setGames((prev) =>
        prev.map((g) =>
          g.id === id
            ? {
                ...g,
                installed: !g.installed,
                shaderStatus: !g.installed ? 'Vulkan DXVK Cache Ready' : 'Not Installed',
              }
            : g
        )
      );
      if (runningId === id) setRunningId(null);
      setBusyId(null);
    }, 450);
  };

  return (
    <div className="h-full flex flex-col bg-[#080B10] text-[#E6EAF0]">
      {/* Steam Top Bar */}
      <header className="px-5 py-3 border-b border-white/[0.08] bg-[#0B1018] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-5">
          <span className="font-display text-sm font-semibold tracking-wider text-white">STEAM</span>
          <nav className="flex items-center gap-1">
            {(
              [
                { id: 'library', label: 'LIBRARY' },
                { id: 'store', label: 'STORE' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                style={tab === item.id ? { color: 'var(--sl8-accent)', borderColor: 'var(--sl8-accent)' } : undefined}
                className={`px-3 py-1.5 text-xs font-mono tracking-wider border-b-2 transition-colors ${
                  tab === item.id ? '' : 'border-transparent text-[#8E9AA9] hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-[#8E9AA9]">
          <span className="hidden sm:inline">Ubuntu 26.04 · Wayland Vulkan</span>
          <span className="flex items-center gap-1 text-white">
            <Users className="w-3.5 h-3.5" style={{ color: 'var(--sl8-accent)' }} /> 3 Online
          </span>
        </div>
      </header>

      {tab === 'library' ? (
        <div className="flex-1 min-h-0 flex">
          {/* Game List Sidebar */}
          <aside className="w-56 shrink-0 border-r border-white/[0.08] bg-[#0A0E15] overflow-y-auto p-2 space-y-0.5">
            <p className="px-2.5 py-1.5 text-[10px] font-mono tracking-[0.14em] text-[#7F8B9B]">
              ALL GAMES ({games.length})
            </p>
            {games.map((g) => {
              const active = g.id === selectedGame.id;
              const isRunning = runningId === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedId(g.id)}
                  style={active ? { borderColor: 'var(--sl8-accent)' } : undefined}
                  className={`w-full px-3 py-2.5 rounded-none border-l-2 text-left flex items-center justify-between gap-2 transition-colors ${
                    active
                      ? 'bg-[#141C27] text-white'
                      : 'border-transparent text-[#94A0B2] hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <span className={`text-xs truncate ${g.installed ? 'text-white' : 'text-[#6F7B8C]'}`}>
                    {g.title}
                  </span>
                  {isRunning && (
                    <span className="text-[10px] font-mono text-[#10B981] shrink-0">RUN</span>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Game Detail Canvas */}
          <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-6">
            <div className="p-6 rounded-none border border-white/12 bg-gradient-to-br from-[#101824] via-[#0B1018] to-[#080B10] space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-mono tracking-[0.14em]" style={{ color: 'var(--sl8-accent)' }}>
                    {selectedGame.genre.toUpperCase()} · {selectedGame.runtime.toUpperCase()}
                  </p>
                  <h1 className="font-display text-3xl font-semibold text-white mt-1">
                    {selectedGame.title}
                  </h1>
                  <p className="text-xs text-[#94A0B2] mt-1">{selectedGame.developer}</p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedGame.installed ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setRunningId((cur) => (cur === selectedGame.id ? null : selectedGame.id))
                        }
                        style={
                          runningId === selectedGame.id
                            ? undefined
                            : { backgroundColor: 'var(--sl8-accent)', color: '#05080C' }
                        }
                        className={`px-5 py-2.5 rounded-none text-xs font-display font-semibold flex items-center gap-2 transition-colors ${
                          runningId === selectedGame.id
                            ? 'bg-red-500/20 border border-red-400/50 text-red-200 hover:bg-red-500/30'
                            : 'hover:opacity-90'
                        }`}
                      >
                        {runningId === selectedGame.id ? (
                          <>
                            <Square className="w-3.5 h-3.5" /> STOP
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" /> PLAY
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === selectedGame.id}
                        onClick={() => handleToggleInstall(selectedGame.id)}
                        title="Uninstall game"
                        className="p-2.5 rounded-none border border-white/12 bg-white/[0.04] hover:bg-red-500/20 text-[#94A0B2] hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === selectedGame.id}
                      onClick={() => handleToggleInstall(selectedGame.id)}
                      style={{ backgroundColor: 'var(--sl8-accent)', color: '#05080C' }}
                      className="px-5 py-2.5 rounded-none text-xs font-display font-semibold flex items-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {busyId === selectedGame.id ? 'INSTALLING...' : `INSTALL (${selectedGame.sizeGb})`}
                    </button>
                  )}
                </div>
              </div>

              {runningId === selectedGame.id && (
                <div className="px-4 py-2.5 rounded-none bg-[#10B981]/12 border border-[#10B981]/40 text-xs font-mono text-[#A7F3D0]">
                  Running under Wayland GameMode + Centurion sl8-steam.bwrap sandbox · MangoHud 120 FPS
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/[0.08]">
                <div className="p-3 rounded-none bg-[#070A0F] border border-white/[0.07]">
                  <p className="text-[10px] font-mono text-[#7F8B9B]">PLAY TIME</p>
                  <p className="font-display text-lg font-semibold text-white tabular-nums mt-0.5">
                    {selectedGame.hours.toFixed(1)} hrs
                  </p>
                </div>
                <div className="p-3 rounded-none bg-[#070A0F] border border-white/[0.07]">
                  <p className="text-[10px] font-mono text-[#7F8B9B]">DISK FOOTPRINT</p>
                  <p className="font-display text-lg font-semibold text-white tabular-nums mt-0.5">
                    {selectedGame.sizeGb}
                  </p>
                </div>
                <div className="p-3 rounded-none bg-[#070A0F] border border-white/[0.07]">
                  <p className="text-[10px] font-mono text-[#7F8B9B]">SHADER PIPELINE</p>
                  <p className="text-xs font-mono mt-1.5" style={{ color: 'var(--sl8-accent)' }}>
                    {selectedGame.shaderStatus}
                  </p>
                </div>
              </div>
            </div>

            {/* Linux / Proton Compatibility Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-none bg-[#0B0F17] border border-white/[0.08] space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Cpu className="w-4 h-4" style={{ color: 'var(--sl8-accent)' }} />
                  <span>Proton Compatibility Tool</span>
                </div>
                <select
                  value={protonOverride}
                  onChange={(e) => setProtonOverride(e.target.value)}
                  className="w-full px-3 py-2 rounded-none bg-[#06080D] border border-white/12 text-xs font-mono text-white focus:outline-none"
                >
                  <option>Proton 9.0-4 (Vulkan)</option>
                  <option>Proton Experimental (Bleeding Edge)</option>
                  <option>GE-Proton9-20 (Wayland Native)</option>
                  <option>Steam Linux Runtime 3.0 (Sniper)</option>
                </select>
              </div>

              <div className="p-4 rounded-none bg-[#0B0F17] border border-white/[0.08] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Shield className="w-4 h-4" style={{ color: 'var(--sl8-accent)' }} />
                  <span>Centurion Container</span>
                </div>
                <p className="text-xs text-[#8E9AA9]">
                  Isolated via Bubblewrap (<span className="font-mono text-white">sl8-steam.bwrap</span>) with
                  filesystem access scoped strictly to <span className="font-mono">~/.local/share/Steam</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--sl8-accent)' }} />
            <h1 className="font-display text-lg font-semibold text-white">
              Featured Linux &amp; Proton Verified Titles
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STORE_HIGHLIGHTS.map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-none bg-[#0C111A] border border-white/10 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-base font-semibold text-white">{item.title}</span>
                    <span
                      className="px-2 py-0.5 text-[11px] font-mono font-semibold"
                      style={{ backgroundColor: 'var(--sl8-accent-soft)', color: 'var(--sl8-accent)' }}
                    >
                      {item.discount}
                    </span>
                  </div>
                  <p className="text-xs text-[#8E9AA9] mt-1">{item.tag}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.07]">
                  <span className="font-mono text-sm font-semibold text-white tabular-nums">{item.price}</span>
                  <button
                    type="button"
                    onClick={() => setTab('library')}
                    className="px-3 py-1.5 rounded-none border border-white/15 hover:border-white/30 text-xs font-mono text-white"
                  >
                    View in Library
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
