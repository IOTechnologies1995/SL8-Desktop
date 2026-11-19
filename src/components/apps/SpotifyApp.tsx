import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Search,
  Volume2,
  VolumeX,
  ListMusic,
  Disc3,
  Shuffle,
  Repeat,
} from 'lucide-react';

interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationSec: number;
  playlist: string;
  freqRoot: number;
  liked: boolean;
}

const INITIAL_SPOTIFY_TRACKS: SpotifyTrack[] = [
  { id: 'sp-1', title: 'Midnight Wayland', artist: 'K. Vance', album: 'Obsidian Architecture', durationSec: 204, playlist: 'SL8 Focus', freqRoot: 130.81, liked: true },
  { id: 'sp-2', title: 'Glass Horizon', artist: 'Monolith Audio', album: 'Sharp Reflections', durationSec: 189, playlist: 'SL8 Focus', freqRoot: 146.83, liked: true },
  { id: 'sp-3', title: 'Zero Telemetry Drift', artist: 'Nocturne Systems', album: 'Hardened Core', durationSec: 231, playlist: 'SL8 Focus', freqRoot: 164.81, liked: false },
  { id: 'sp-4', title: 'Neon Rain over Zurich', artist: 'Synthline 84', album: 'Night Protocol', durationSec: 218, playlist: 'Synthwave Night', freqRoot: 110.0, liked: true },
  { id: 'sp-5', title: 'Chrome Grid 1989', artist: 'Vektor Pulse', album: 'Outrun Terminal', durationSec: 196, playlist: 'Synthwave Night', freqRoot: 123.47, liked: false },
  { id: 'sp-6', title: 'Arctic Sub-Bass', artist: 'SL8 Audio Lab', album: 'Dark Slate Sessions', durationSec: 242, playlist: 'Synthwave Night', freqRoot: 98.0, liked: true },
  { id: 'sp-7', title: 'Kernel Compile Loop', artist: 'Lo-Fi Daemon', album: 'Ubuntu 26.04 Beats', durationSec: 174, playlist: 'Linux Dev Flow', freqRoot: 174.61, liked: true },
  { id: 'sp-8', title: 'PipeWire Velvet', artist: 'Low Latency Collective', album: 'Real-Time Audio', durationSec: 210, playlist: 'Linux Dev Flow', freqRoot: 196.0, liked: false },
];

const PLAYLISTS = ['Liked Songs', 'SL8 Focus', 'Synthwave Night', 'Linux Dev Flow'];

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const SpotifyApp: React.FC = () => {
  const [tracks, setTracks] = useState<SpotifyTrack[]>(INITIAL_SPOTIFY_TRACKS);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('SL8 Focus');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string>(INITIAL_SPOTIFY_TRACKS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);

  const activeTrack = tracks.find((t) => t.id === activeId) ?? tracks[0];

  const visibleTracks = tracks.filter((t) => {
    const q = query.trim().toLowerCase();
    if (q) {
      return (
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
      );
    }
    if (selectedPlaylist === 'Liked Songs') return t.liked;
    return t.playlist === selectedPlaylist;
  });

  const stopSynth = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startSynth = useCallback(
    (root: number) => {
      stopSynth();
      if (!audioCtxRef.current) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const g = ctx.createGain();
        g.gain.value = muted ? 0 : volume * 0.14;
        g.connect(ctx.destination);
        audioCtxRef.current = ctx;
        gainRef.current = g;
      }
      const ctx = audioCtxRef.current;
      const master = gainRef.current;
      if (!ctx || !master) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      const notes = [1, 1.25, 1.5, 1.875];
      let step = 0;

      const trigger = () => {
        const now = ctx.currentTime;
        const ratio = notes[step % notes.length];
        step += 1;

        [root, root * ratio].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const env = ctx.createGain();
          osc.type = idx === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          env.gain.setValueAtTime(0.0001, now);
          env.gain.linearRampToValueAtTime(idx === 0 ? 0.35 : 0.18, now + 0.12);
          env.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
          osc.connect(env);
          env.connect(master);
          osc.start(now);
          osc.stop(now + 1.55);
        });
      };

      trigger();
      timerRef.current = window.setInterval(trigger, 1450);
    },
    [muted, stopSynth, volume]
  );

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = muted ? 0 : volume * 0.14;
    }
  }, [volume, muted]);

  useEffect(() => {
    if (isPlaying && activeTrack) {
      startSynth(activeTrack.freqRoot);
    } else {
      stopSynth();
    }
  }, [isPlaying, activeTrack, startSynth, stopSynth]);

  useEffect(() => {
    return () => {
      stopSynth();
      audioCtxRef.current?.close().catch(() => {});
    };
  }, [stopSynth]);

  const handleNext = useCallback(() => {
    const list = visibleTracks.length > 0 ? visibleTracks : tracks;
    const idx = list.findIndex((t) => t.id === activeTrack.id);
    const next = shuffle
      ? list[Math.floor(Math.random() * list.length)]
      : list[(idx + 1) % list.length];
    setActiveId(next.id);
    setElapsed(0);
  }, [visibleTracks, tracks, activeTrack.id, shuffle]);

  const handlePrev = useCallback(() => {
    const list = visibleTracks.length > 0 ? visibleTracks : tracks;
    const idx = list.findIndex((t) => t.id === activeTrack.id);
    const prev = list[(idx - 1 + list.length) % list.length];
    setActiveId(prev.id);
    setElapsed(0);
  }, [visibleTracks, tracks, activeTrack.id]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= activeTrack.durationSec) {
          if (repeat) return 0;
          handleNext();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isPlaying, activeTrack.durationSec, repeat, handleNext]);

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, liked: !t.liked } : t)));
  };

  return (
    <div className="h-full flex flex-col bg-[#080A0D] text-[#E6EAF0]">
      <div className="flex-1 min-h-0 flex">
        {/* Sharp Glass Sidebar */}
        <aside className="w-52 shrink-0 border-r border-white/[0.08] bg-[#0B0E12] p-3 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="px-2 pt-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#1DB954]" />
              <span className="font-display text-sm font-semibold tracking-wide text-white">Spotify</span>
              <span className="text-[10px] font-mono text-[#7F8B9B] ml-auto">Flatpak</span>
            </div>

            <div className="space-y-1">
              <p className="px-2 pb-1 text-[10px] font-mono uppercase tracking-[0.14em] text-[#7F8B9B]">
                Playlists
              </p>
              {PLAYLISTS.map((pl) => {
                const active = selectedPlaylist === pl && !query;
                return (
                  <button
                    key={pl}
                    type="button"
                    onClick={() => {
                      setSelectedPlaylist(pl);
                      setQuery('');
                    }}
                    className={`w-full px-2.5 py-2 rounded-none text-left text-xs font-medium flex items-center gap-2 border-l-2 transition-colors ${
                      active
                        ? 'bg-[#141A21] text-white border-[#1DB954]'
                        : 'text-[#94A0B2] border-transparent hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {pl === 'Liked Songs' ? (
                      <Heart className="w-3.5 h-3.5 text-[#1DB954] shrink-0" />
                    ) : (
                      <ListMusic className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="truncate">{pl}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-2.5 rounded-none bg-[#06080B] border border-white/[0.08] text-[11px] text-[#8E9AA9]">
            <p className="text-white font-medium">Centurion Sandbox</p>
            <p className="font-mono text-[10px] text-[#1DB954] mt-0.5">PipeWire · WireGuard Only</p>
          </div>
        </aside>

        {/* Main Library View */}
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="px-5 py-4 border-b border-white/[0.08] bg-[#0B0F14] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div>
              <p className="text-[10px] font-mono tracking-[0.16em] text-[#1DB954]">
                {query ? 'SEARCH RESULTS' : 'PLAYLIST'}
              </p>
              <h1 className="font-display text-xl font-semibold text-white mt-0.5">
                {query ? `Matches for "${query}"` : selectedPlaylist}
              </h1>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#7F8B9B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter tracks or artists..."
                className="w-56 pl-8 pr-3 py-1.5 rounded-none bg-[#06080C] border border-white/12 text-xs text-white placeholder-[#6B7687] focus:outline-none focus:border-[#1DB954]"
              />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05]">
            {visibleTracks.length === 0 ? (
              <div className="p-10 text-center text-xs text-[#7F8B9B]">No tracks in this view.</div>
            ) : (
              visibleTracks.map((trk, idx) => {
                const isCurrent = trk.id === activeTrack.id;
                return (
                  <button
                    key={trk.id}
                    type="button"
                    onClick={() => {
                      if (isCurrent) {
                        setIsPlaying((p) => !p);
                      } else {
                        setActiveId(trk.id);
                        setElapsed(0);
                        setIsPlaying(true);
                      }
                    }}
                    className={`w-full px-5 py-3 text-left flex items-center justify-between gap-4 transition-colors ${
                      isCurrent ? 'bg-[#11191E]' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="w-5 text-xs font-mono tabular-nums text-[#7F8B9B]">
                        {isCurrent && isPlaying ? '▶' : String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="w-8 h-8 rounded-none bg-[#121720] border border-white/10 flex items-center justify-center shrink-0">
                        <Disc3 className={`w-4 h-4 ${isCurrent ? 'text-[#1DB954]' : 'text-[#7F8B9B]'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isCurrent ? 'text-[#1DB954]' : 'text-white'}`}>
                          {trk.title}
                        </p>
                        <p className="text-xs text-[#8E9AA9] truncate">
                          {trk.artist} · {trk.album}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={trk.liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
                        onClick={(e) => toggleLike(trk.id, e)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') toggleLike(trk.id, e as unknown as React.MouseEvent);
                        }}
                        className="p-1 text-[#8E9AA9] hover:text-[#1DB954]"
                      >
                        <Heart
                          className="w-3.5 h-3.5"
                          fill={trk.liked ? '#1DB954' : 'none'}
                          color={trk.liked ? '#1DB954' : 'currentColor'}
                        />
                      </span>
                      <span className="text-xs font-mono text-[#7F8B9B] tabular-nums w-10 text-right">
                        {fmt(trk.durationSec)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Playback Strip */}
      <footer className="px-4 py-3 border-t border-white/[0.1] bg-[#0B0E14] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="min-w-0 max-w-[200px]">
          <p className="text-xs font-medium text-white truncate">{activeTrack.title}</p>
          <p className="text-[11px] text-[#8E9AA9] truncate">{activeTrack.artist}</p>
        </div>

        <div className="flex-1 min-w-[220px] max-w-md space-y-1.5">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShuffle((s) => !s)}
              aria-label="Shuffle"
              className={`p-1 ${shuffle ? 'text-[#1DB954]' : 'text-[#7F8B9B] hover:text-white'}`}
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={handlePrev} aria-label="Previous track" className="p-1 text-[#D5DCE6] hover:text-white">
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-8 h-8 rounded-none bg-[#1DB954] hover:bg-[#22D360] text-[#05080A] flex items-center justify-center"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
            </button>
            <button type="button" onClick={handleNext} aria-label="Next track" className="p-1 text-[#D5DCE6] hover:text-white">
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setRepeat((r) => !r)}
              aria-label="Repeat"
              className={`p-1 ${repeat ? 'text-[#1DB954]' : 'text-[#7F8B9B] hover:text-white'}`}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#7F8B9B] tabular-nums">
            <span className="w-8 text-right">{fmt(elapsed)}</span>
            <input
              type="range"
              min={0}
              max={activeTrack.durationSec}
              value={elapsed}
              onChange={(e) => setElapsed(Number(e.target.value))}
              aria-label="Seek track"
              className="flex-1 accent-[#1DB954] cursor-pointer h-1"
            />
            <span className="w-8">{fmt(activeTrack.durationSec)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-28 shrink-0">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="text-[#94A0B2] hover:text-white"
          >
            {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={muted ? 0 : volume}
            onChange={(e) => {
              setMuted(false);
              setVolume(Number(e.target.value));
            }}
            aria-label="Spotify Volume"
            className="w-full accent-[#1DB954] cursor-pointer h-1"
          />
        </div>
      </footer>
    </div>
  );
};
