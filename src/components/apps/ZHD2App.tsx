import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Plus,
  FolderPlus,
  Music,
  Film,
  AudioLines,
  Radio,
  Settings,
  Pin,
  ChevronLeft,
  Sparkles,
  Monitor,
} from 'lucide-react';
import { MediaTrack } from '../../types/os';

interface ZHD2AppProps {
  tracks: MediaTrack[];
  onAddTracks: (newTracks: MediaTrack[]) => void;
}

type PivotTab = 'zhd2' | 'quickplay' | 'services' | 'nowplaying';
type CollectionView = 'root' | 'music' | 'videos' | 'spotify' | 'pandora' | 'settings';
type ZhdStyle = 'Zune HD' | 'Zune 30GB' | 'Metro Tiles';
type VisualizerMode = 'None' | 'Spectrum Bars' | 'Waveform Scope' | 'Radial Pulse' | 'Matrix Grid';

const PIVOT_ORDER: PivotTab[] = ['zhd2', 'quickplay', 'services', 'nowplaying'];

const VISUALIZER_MODES: VisualizerMode[] = [
  'None',
  'Spectrum Bars',
  'Waveform Scope',
  'Radial Pulse',
  'Matrix Grid',
];

const ACCENT_PRESETS: Record<string, string> = {
  Cyan: '#00D8E8',
  White: '#E6EAF0',
  Magenta: '#E6007A',
  Amber: '#F59E0B',
  Emerald: '#1DB954',
};

const EQ_BANDS = [
  { label: '60 Hz', freq: 60 },
  { label: '230 Hz', freq: 230 },
  { label: '910 Hz', freq: 910 },
  { label: '3.6 kHz', freq: 3600 },
  { label: '14 kHz', freq: 14000 },
];

const EQ_PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0],
  'Zune Warm': [4, 2, 0, 2, 3],
  'Sub Bass': [7, 4, -1, 1, 2],
  Vocal: [-2, 1, 4, 3, 0],
};

const SYNTH_CHORDS: Record<NonNullable<MediaTrack['synthPreset']>, number[][]> = {
  obsidian: [
    [130.81, 196.0, 246.94, 329.63],
    [110.0, 164.81, 220.0, 293.66],
    [146.83, 220.0, 261.63, 349.23],
    [98.0, 146.83, 196.0, 293.66],
  ],
  horizon: [
    [164.81, 246.94, 329.63, 392.0],
    [130.81, 196.0, 261.63, 329.63],
    [146.83, 220.0, 293.66, 369.99],
    [123.47, 185.0, 246.94, 369.99],
  ],
  pulse: [
    [110.0, 220.0, 261.63, 329.63],
    [116.54, 233.08, 293.66, 349.23],
    [130.81, 261.63, 329.63, 392.0],
    [98.0, 196.0, 246.94, 293.66],
  ],
  velvet: [
    [174.61, 220.0, 261.63, 329.63],
    [146.83, 174.61, 220.0, 293.66],
    [130.81, 164.81, 196.0, 246.94],
    [110.0, 164.81, 220.0, 261.63],
  ],
};

const RADIO_STATIONS = [
  { id: 'rad-1', name: 'Midnight Synth Radio', genre: 'Electronic · 320 kbps', preset: 'obsidian' as const },
  { id: 'rad-2', name: 'Deep Focus Ambient', genre: 'Minimal · 320 kbps', preset: 'velvet' as const },
  { id: 'rad-3', name: 'Cyberline Pulse FM', genre: 'Downtempo · 256 kbps', preset: 'pulse' as const },
  { id: 'rad-4', name: 'Nordic Horizon Live', genre: 'Atmospheric · 320 kbps', preset: 'horizon' as const },
];

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const ZHD2App: React.FC<ZHD2AppProps> = ({ tracks, onAddTracks }) => {
  const [pivot, setPivot] = useState<PivotTab>('zhd2');
  const [collectionView, setCollectionView] = useState<CollectionView>('root');
  const [activeTrackId, setActiveTrackId] = useState<string>(tracks[0]?.id ?? '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(tracks[0]?.durationSec ?? 180);
  const [volume, setVolume] = useState(0.76);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  // ZHD2 Settings + Visualizations & Screensaver
  const [uiStyle, setUiStyle] = useState<ZhdStyle>('Zune HD');
  const [accentName, setAccentName] = useState<string>('Cyan');
  const [fontStyle, setFontStyle] = useState<'Metro Light' | 'Clean Sans'>('Metro Light');
  const [visualizer, setVisualizer] = useState<VisualizerMode>('Spectrum Bars');
  const [screensaverActive, setScreensaverActive] = useState(false);
  const [screensaverCountdown, setScreensaverCountdown] = useState<number>(8);
  const [saverDrift, setSaverDrift] = useState(0);

  const [eqGains, setEqGains] = useState<number[]>([0, 0, 0, 0, 0]);
  const [activeEqPreset, setActiveEqPreset] = useState<string>('Flat');
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [activeStation, setActiveStation] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const touchOriginRef = useRef<{ x: number; y: number } | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const synthTimerRef = useRef<number | null>(null);
  const activeOscsRef = useRef<OscillatorNode[]>([]);
  const chordStepRef = useRef(0);

  const accentHex = ACCENT_PRESETS[accentName] ?? '#00D8E8';
  const activeTrack = tracks.find((t) => t.id === activeTrackId) ?? tracks[0];
  const musicTracks = tracks.filter((t) => t.mediaType === 'audio');
  const videoTracks = tracks.filter((t) => t.mediaType === 'video');

  const stopSynthVoices = useCallback(() => {
    if (synthTimerRef.current !== null) {
      window.clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    activeOscsRef.current.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore already stopped oscillators
      }
    });
    activeOscsRef.current = [];
  }, []);

  const ensureAudioGraph = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const masterGain = ctx.createGain();
      masterGain.gain.value = muted ? 0 : volume * 0.22;

      const filters = EQ_BANDS.map((b, i) => {
        const f = ctx.createBiquadFilter();
        f.type = i === 0 ? 'lowshelf' : i === EQ_BANDS.length - 1 ? 'highshelf' : 'peaking';
        f.frequency.value = b.freq;
        f.gain.value = eqGains[i];
        return f;
      });

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      let node: AudioNode = masterGain;
      filters.forEach((f) => {
        node.connect(f);
        node = f;
      });
      node.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      gainRef.current = masterGain;
      eqFiltersRef.current = filters;
      analyserRef.current = analyser;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, [eqGains, muted, volume]);

  const startSynthPlayback = useCallback(
    (preset: NonNullable<MediaTrack['synthPreset']>) => {
      stopSynthVoices();
      const ctx = ensureAudioGraph();
      const masterGain = gainRef.current;
      if (!masterGain) return;

      const chords = SYNTH_CHORDS[preset] || SYNTH_CHORDS.obsidian;

      const playChord = () => {
        const chord = chords[chordStepRef.current % chords.length];
        chordStepRef.current += 1;
        const now = ctx.currentTime;
        const chordDuration = 2.6;

        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const voiceGain = ctx.createGain();
          osc.type = idx === 0 ? 'triangle' : idx % 2 === 0 ? 'sine' : 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);

          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.setValueAtTime(idx === 0 ? 480 : 1200, now);

          voiceGain.gain.setValueAtTime(0.0001, now);
          voiceGain.gain.linearRampToValueAtTime(idx === 0 ? 0.28 : 0.11, now + 0.35);
          voiceGain.gain.exponentialRampToValueAtTime(0.001, now + chordDuration);

          osc.connect(lp);
          lp.connect(voiceGain);
          voiceGain.connect(masterGain);

          osc.start(now);
          osc.stop(now + chordDuration + 0.05);
          activeOscsRef.current.push(osc);
        });
      };

      playChord();
      synthTimerRef.current = window.setInterval(playChord, 2400);
    },
    [ensureAudioGraph, stopSynthVoices]
  );

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = muted ? 0 : volume * 0.22;
    }
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
    if (videoRef.current) videoRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    eqFiltersRef.current.forEach((f, i) => {
      f.gain.value = eqGains[i];
    });
  }, [eqGains]);

  useEffect(() => {
    return () => {
      stopSynthVoices();
      audioCtxRef.current?.close().catch(() => {});
    };
  }, [stopSynthVoices]);

  useEffect(() => {
    if (!activeTrack) return;
    if (activeTrack.sourceType === 'synth') {
      if (isPlaying) {
        startSynthPlayback(activeTrack.synthPreset ?? 'obsidian');
      } else {
        stopSynthVoices();
      }
    } else {
      stopSynthVoices();
      const mediaEl = activeTrack.mediaType === 'video' ? videoRef.current : audioRef.current;
      if (mediaEl) {
        if (isPlaying) mediaEl.play().catch(() => {});
        else mediaEl.pause();
      }
    }
  }, [isPlaying, activeTrack, startSynthPlayback, stopSynthVoices]);

  // Auto-activate Screensaver when staying on Now Playing with visualization === 'None'
  useEffect(() => {
    if (pivot !== 'nowplaying' || visualizer !== 'None') {
      setScreensaverActive(false);
      setScreensaverCountdown(8);
      return;
    }
    if (screensaverActive) return;

    setScreensaverCountdown(8);
    const interval = window.setInterval(() => {
      setScreensaverCountdown((prev) => {
        if (prev <= 1) {
          setScreensaverActive(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [pivot, visualizer, screensaverActive, activeTrackId]);

  // Smooth drift animation for Zune HD kinetic typography screensaver
  useEffect(() => {
    if (!screensaverActive) return;
    let frame = 0;
    let t = 0;
    const step = () => {
      t += 0.008;
      setSaverDrift(t);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [screensaverActive]);

  const handleNext = useCallback(() => {
    if (tracks.length === 0) return;
    const idx = tracks.findIndex((t) => t.id === activeTrack?.id);
    const nextIdx = shuffle ? Math.floor(Math.random() * tracks.length) : (idx + 1) % tracks.length;
    const nextTrack = tracks[nextIdx];
    setActiveTrackId(nextTrack.id);
    setCurrentTime(0);
    setDuration(nextTrack.durationSec);
  }, [tracks, activeTrack, shuffle]);

  const handlePrev = useCallback(() => {
    if (tracks.length === 0) return;
    if (currentTime > 4) {
      setCurrentTime(0);
      const mediaEl = activeTrack?.mediaType === 'video' ? videoRef.current : audioRef.current;
      if (mediaEl) mediaEl.currentTime = 0;
      return;
    }
    const idx = tracks.findIndex((t) => t.id === activeTrack?.id);
    const prevIdx = (idx - 1 + tracks.length) % tracks.length;
    const prevTrack = tracks[prevIdx];
    setActiveTrackId(prevTrack.id);
    setCurrentTime(0);
    setDuration(prevTrack.durationSec);
  }, [tracks, activeTrack, currentTime]);

  useEffect(() => {
    if (!isPlaying || !activeTrack || activeTrack.sourceType !== 'synth') return;
    const timer = window.setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.25;
        if (next >= activeTrack.durationSec) {
          if (repeat) return 0;
          handleNext();
          return 0;
        }
        return next;
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [isPlaying, activeTrack, repeat, handleNext]);

  // Multi-Mode Live Visualization Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || visualizer === 'None' || pivot !== 'nowplaying') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const barCount = 44;
    const peaks = new Array(barCount).fill(0);
    const freqData = new Uint8Array(128);
    const timeData = new Uint8Array(128);
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const analyser = analyserRef.current;
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);
      }
      phase += isPlaying ? 0.055 : 0.012;

      if (visualizer === 'Spectrum Bars') {
        const gap = 4;
        const barWidth = Math.max(3, (width - gap * (barCount - 1)) / barCount);
        for (let i = 0; i < barCount; i++) {
          let energy = 0.04;
          if (isPlaying) {
            const raw = analyser ? freqData[Math.min(freqData.length - 1, Math.floor(i * 1.4))] / 255 : 0;
            const wave = 0.16 + 0.25 * Math.abs(Math.sin(phase + i * 0.24));
            energy = Math.min(0.95, Math.max(raw * 1.2, wave));
          } else {
            energy = 0.04 + 0.025 * Math.sin(i * 0.4 + phase);
          }

          const barHeight = Math.max(3, energy * (height - 18));
          peaks[i] = Math.max(peaks[i] - 0.9, barHeight);
          const x = i * (barWidth + gap);
          const y = height - barHeight;

          ctx.fillStyle = isPlaying ? accentHex : 'rgba(148, 160, 178, 0.28)';
          ctx.globalAlpha = isPlaying ? 0.82 : 1;
          ctx.fillRect(x, y, barWidth, barHeight);
          ctx.globalAlpha = 1;

          ctx.fillStyle = isPlaying ? '#FFFFFF' : 'rgba(148, 160, 178, 0.4)';
          ctx.fillRect(x, height - peaks[i] - 3, barWidth, 2);
        }
      } else if (visualizer === 'Waveform Scope') {
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        ctx.strokeStyle = accentHex;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const slices = 96;
        for (let i = 0; i <= slices; i++) {
          const x = (i / slices) * width;
          let amp = 0;
          if (isPlaying) {
            const raw = analyser ? (timeData[Math.min(timeData.length - 1, i)] - 128) / 128 : 0;
            const synthWave =
              Math.sin(phase * 2.1 + i * 0.22) * 0.32 + Math.cos(phase * 1.3 - i * 0.11) * 0.18;
            amp = Math.abs(raw) > 0.02 ? raw * 0.9 : synthWave;
          } else {
            amp = Math.sin(phase + i * 0.15) * 0.04;
          }
          const y = height / 2 + amp * (height * 0.42);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Secondary sharp echo trace
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= slices; i++) {
          const x = (i / slices) * width;
          const amp = isPlaying ? Math.sin(phase * 1.6 + i * 0.18 + 1.2) * 0.2 : 0.02;
          const y = height / 2 + amp * (height * 0.36);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else if (visualizer === 'Radial Pulse') {
        const cx = width / 2;
        const cy = height / 2;
        const baseR = Math.min(width, height) * 0.24;
        const spokes = 48;

        for (let i = 0; i < spokes; i++) {
          const angle = (i / spokes) * Math.PI * 2 + phase * 0.25;
          const raw = analyser && isPlaying ? freqData[i % freqData.length] / 255 : 0;
          const energy = isPlaying
            ? Math.max(raw * 0.9, 0.2 + 0.32 * Math.abs(Math.sin(phase * 1.8 + i * 0.35)))
            : 0.08;
          const r1 = baseR;
          const r2 = baseR + energy * (Math.min(width, height) * 0.28);

          ctx.strokeStyle = i % 2 === 0 ? accentHex : '#FFFFFF';
          ctx.globalAlpha = i % 2 === 0 ? 0.85 : 0.45;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
          ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = accentHex;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - baseR * 0.6, cy - baseR * 0.6, baseR * 1.2, baseR * 1.2);
      } else if (visualizer === 'Matrix Grid') {
        const cols = 22;
        const rows = 7;
        const cellW = width / cols;
        const cellH = height / rows;
        for (let c = 0; c < cols; c++) {
          const raw = analyser && isPlaying ? freqData[Math.min(freqData.length - 1, c * 3)] / 255 : 0;
          const level = isPlaying
            ? Math.max(raw, 0.2 + 0.5 * Math.abs(Math.sin(phase * 1.5 + c * 0.35)))
            : 0.12;
          const activeRows = Math.round(level * rows);
          for (let r = 0; r < rows; r++) {
            const fromBottom = rows - 1 - r;
            const lit = fromBottom < activeRows;
            ctx.fillStyle = lit
              ? fromBottom === activeRows - 1
                ? '#FFFFFF'
                : accentHex
              : 'rgba(255,255,255,0.05)';
            ctx.globalAlpha = lit ? 0.85 : 1;
            ctx.fillRect(c * cellW + 2, r * cellH + 2, cellW - 4, cellH - 4);
          }
        }
        ctx.globalAlpha = 1;
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, activeTrack, accentHex, visualizer, pivot]);

  const handleImportMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const added: MediaTrack[] = Array.from(selectedFiles)
      .filter((f) => f.type.startsWith('audio/') || f.type.startsWith('video/'))
      .map((file, idx) => {
        const isVideo = file.type.startsWith('video/');
        const ext = file.name.split('.').pop()?.toUpperCase() || (isVideo ? 'MP4' : 'MP3');
        return {
          id: `local-${Date.now()}-${idx}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'Local Media',
          album: isVideo ? 'Imported Videos' : 'Imported Music',
          durationSec: 0,
          format: ext,
          bitrate: `${Math.max(1, Math.round(file.size / 1024))} KB`,
          mediaType: isVideo ? 'video' : 'audio',
          sourceType: 'local',
          objectUrl: URL.createObjectURL(file),
          pinned: true,
        };
      });

    if (added.length > 0) {
      onAddTracks(added);
      setActiveTrackId(added[0].id);
      setCurrentTime(0);
      setIsPlaying(true);
      setPivot('nowplaying');
    }
    e.target.value = '';
  };

  const playTrack = (track: MediaTrack) => {
    setActiveStation(null);
    setActiveTrackId(track.id);
    setCurrentTime(0);
    setDuration(track.durationSec || 0);
    setIsPlaying(true);
  };

  const handleSeek = (nextSec: number) => {
    setCurrentTime(nextSec);
    if (activeTrack?.sourceType === 'local') {
      const mediaEl = activeTrack.mediaType === 'video' ? videoRef.current : audioRef.current;
      if (mediaEl) mediaEl.currentTime = nextSec;
    }
  };

  // Touch Swipe Support matching ZHD2 ("SWIPE RIGHT: NEXT MENU · SWIPE UP: NOW PLAYING")
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    touchOriginRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchOriginRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchOriginRef.current.x;
    const dy = t.clientY - touchOriginRef.current.y;
    touchOriginRef.current = null;

    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy)) {
      const idx = PIVOT_ORDER.indexOf(pivot);
      const nextIdx = dx > 0 ? (idx + 1) % PIVOT_ORDER.length : (idx - 1 + PIVOT_ORDER.length) % PIVOT_ORDER.length;
      setPivot(PIVOT_ORDER[nextIdx]);
    } else if (dy < -75 && Math.abs(dy) > Math.abs(dx)) {
      setPivot('nowplaying');
    }
  };

  const menuRows = [
    {
      id: 'music' as const,
      title: 'music',
      subtitle: `${musicTracks.length} TRACKS · MP3 / FLAC / WAV / OGG`,
      accent: accentHex,
      icon: Music,
    },
    {
      id: 'videos' as const,
      title: 'videos',
      subtitle: `${videoTracks.length} VIDEOS · MP4 / MKV / WEBM`,
      accent: accentHex,
      icon: Film,
    },
    {
      id: 'spotify' as const,
      title: 'spotify',
      subtitle: spotifyConnected ? 'CONNECTED · STREAMING READY' : 'CONNECT ACCOUNT OR OPEN',
      accent: '#1DB954',
      icon: AudioLines,
    },
    {
      id: 'pandora' as const,
      title: 'pandora',
      subtitle: 'WEB STATIONS & LIVE RADIO',
      accent: '#2F6BFF',
      icon: Radio,
    },
    {
      id: 'settings' as const,
      title: 'settings',
      subtitle: 'UI STYLE · VISUALIZER · ACCENT · EQUALIZER',
      accent: accentHex,
      icon: Settings,
    },
  ];

  const currentDisplayTitle = activeStation
    ? RADIO_STATIONS.find((s) => s.id === activeStation)?.name ?? 'Live Radio'
    : activeTrack?.title ?? 'ZHD2';
  const currentDisplaySub = activeStation
    ? 'Pandora / Live Web Radio'
    : `${activeTrack?.artist ?? 'SL8 Audio'} · ${activeTrack?.album ?? 'Collection'}`;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="h-full flex flex-col bg-[#050506] text-[#F2F5F8] relative overflow-hidden"
    >
      {/* Subtle atmospheric Zune-style dark radial wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(circle at 74% 38%, rgba(36, 44, 54, 0.34) 0%, rgba(10, 12, 16, 0.85) 52%, rgba(5, 5, 6, 1) 100%)',
        }}
      />

      {/* Zune HD / Metro Screensaver Overlay (auto-activates on Now Playing when Visualization = None) */}
      {screensaverActive && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setScreensaverActive(false);
            setScreensaverCountdown(8);
          }}
          onKeyDown={() => {
            setScreensaverActive(false);
            setScreensaverCountdown(8);
          }}
          className="absolute inset-0 z-40 bg-[#030406] flex flex-col justify-between p-8 overflow-hidden cursor-pointer select-none"
        >
          {/* Drifting geometric glass light planes */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(115deg, transparent 20%, ${accentHex}22 50%, transparent 80%)`,
              transform: `translateX(${Math.sin(saverDrift * 0.7) * 80}px)`,
            }}
          />

          <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-[#7F8B9B]">
            <span style={{ color: accentHex }}>ZHD2 SCREENSAVER · METRO KINETIC</span>
            <span>CLICK OR TAP TO EXIT</span>
          </div>

          <div
            className="relative z-10 space-y-2 pointer-events-none"
            style={{
              transform: `translate3d(${Math.sin(saverDrift * 0.65) * 34}px, ${Math.cos(saverDrift * 0.45) * 20}px, 0)`,
            }}
          >
            <p
              className="font-display text-5xl sm:text-7xl font-normal tracking-tight lowercase leading-none opacity-15 text-white truncate"
              style={{ transform: `translateX(${Math.cos(saverDrift * 0.5) * -28}px)` }}
            >
              {activeTrack?.artist ?? 'zhd2'}
            </p>
            <h2 className="font-display text-4xl sm:text-6xl font-normal tracking-tight text-white">
              {currentDisplayTitle}
            </h2>
            <p className="text-base sm:text-lg text-[#9AA6B7]" style={{ color: accentHex }}>
              {currentDisplaySub}
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-mono text-[#8E9AA9] tabular-nums">
            <span>{isPlaying ? 'PLAYING' : 'PAUSED'}</span>
            <span>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      )}

      {activeTrack?.sourceType === 'local' && activeTrack.mediaType === 'audio' && (
        <audio
          ref={audioRef}
          src={activeTrack.objectUrl}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onEnded={() => {
            if (repeat && audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {});
            } else {
              handleNext();
            }
          }}
        />
      )}

      {/* Zune HD / Metro Pivot Header */}
      <header className="relative z-10 px-6 pt-4 pb-2 flex items-baseline justify-between gap-4 border-b border-white/[0.06] shrink-0">
        <nav aria-label="ZHD2 Pivot Navigation" className="flex items-baseline gap-6 overflow-x-auto">
          {(
            [
              { id: 'zhd2', label: 'zhd2' },
              { id: 'quickplay', label: 'quickplay' },
              { id: 'services', label: 'services' },
              { id: 'nowplaying', label: 'now playing' },
            ] as const
          ).map((item) => {
            const active = pivot === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setPivot(item.id);
                  if (item.id === 'zhd2') setCollectionView('root');
                }}
                style={active ? { color: accentHex } : undefined}
                className={`font-display text-sm tracking-wide lowercase transition-colors whitespace-nowrap shrink-0 ${
                  active ? 'font-medium' : 'text-[#6F7885] hover:text-[#B9C2CF]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <span className="text-[11px] font-mono text-[#6B7687] hidden sm:inline whitespace-nowrap">
          {uiStyle} · {visualizer === 'None' ? 'Screensaver Ready' : visualizer}
        </span>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {pivot === 'zhd2' && (
          <>
            {/* Left Metro / Zune Collection Column */}
            <div className="w-full md:w-[370px] shrink-0 px-6 py-4 overflow-y-auto border-b md:border-b-0 md:border-r border-white/[0.06] flex flex-col justify-between gap-5">
              <div>
                <p className="text-xs tracking-wider text-[#7A8492] lowercase mb-4">collection</p>

                <div className="space-y-4">
                  {menuRows.map((row) => {
                    const Icon = row.icon;
                    const selected = collectionView === row.id;
                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => setCollectionView(row.id)}
                        className={`group w-full flex items-center justify-between gap-3 py-1 text-left transition-opacity ${
                          selected ? 'opacity-100' : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-stretch gap-3.5 min-w-0">
                          <span
                            aria-hidden="true"
                            className="w-[3px] shrink-0 transition-transform duration-150 group-hover:scale-y-105"
                            style={{ backgroundColor: row.accent }}
                          />
                          <div className="min-w-0">
                            <p
                              className={`font-display text-[28px] leading-[1.08] tracking-tight lowercase transition-colors ${
                                fontStyle === 'Metro Light' ? 'font-normal' : 'font-medium'
                              }`}
                              style={selected ? { color: row.accent } : { color: '#FFFFFF' }}
                            >
                              {row.title}
                            </p>
                            <p className="text-[10px] font-mono tracking-[0.14em] text-[#788290] mt-1 truncate">
                              {row.subtitle}
                            </p>
                          </div>
                        </div>

                        <Icon
                          className="w-5 h-5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                          style={{ color: row.accent }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* IMPORT LOCAL MEDIA */}
              <div className="pt-3 border-t border-white/[0.06] space-y-2.5">
                <p className="text-[10px] font-mono tracking-[0.16em] text-[#7A8492]">
                  IMPORT LOCAL MEDIA
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="px-3.5 py-2.5 rounded-none bg-[#111419] hover:bg-[#191E26] border border-white/[0.08] flex items-center justify-center gap-2 text-xs text-white cursor-pointer transition-colors">
                    <Plus className="w-3.5 h-3.5" style={{ color: accentHex }} />
                    <span>add files</span>
                    <input
                      type="file"
                      accept="audio/*,video/*"
                      multiple
                      onChange={handleImportMedia}
                      className="hidden"
                    />
                  </label>
                  <label className="px-3.5 py-2.5 rounded-none bg-[#111419] hover:bg-[#191E26] border border-white/[0.08] flex items-center justify-center gap-2 text-xs text-white cursor-pointer transition-colors">
                    <FolderPlus className="w-3.5 h-3.5" style={{ color: accentHex }} />
                    <span>add folder</span>
                    <input
                      type="file"
                      accept="audio/*,video/*"
                      multiple
                      onChange={handleImportMedia}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[9px] font-mono tracking-[0.14em] text-[#5F6978]">
                  SWIPE RIGHT: NEXT MENU · SWIPE UP: NOW PLAYING
                </p>
              </div>
            </div>

            {/* Right Desktop Detail Viewport */}
            <div className="flex-1 min-w-0 p-6 overflow-y-auto">
              {(collectionView === 'root' || collectionView === 'music') && (
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between border-b border-white/[0.07] pb-2.5">
                    <div>
                      <h2 className="font-display text-2xl font-normal lowercase text-white">music</h2>
                      <p className="text-[11px] font-mono text-[#788290]">
                        {musicTracks.length} tracks · click any item to play
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPivot('nowplaying')}
                      style={{ color: accentHex }}
                      className="text-xs lowercase hover:underline"
                    >
                      open now playing
                    </button>
                  </div>

                  <div className={uiStyle === 'Metro Tiles' ? 'grid grid-cols-2 gap-2.5' : 'divide-y divide-white/[0.05]'}>
                    {musicTracks.map((track) => {
                      const active = track.id === activeTrack?.id;
                      return (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() => playTrack(track)}
                          className={
                            uiStyle === 'Metro Tiles'
                              ? `p-4 rounded-none text-left border transition-colors ${
                                  active ? 'bg-[#121922]' : 'bg-[#0D1015] hover:bg-[#141922]'
                                }`
                              : `w-full py-3 px-2 rounded-none text-left flex items-center justify-between gap-3 transition-colors hover:bg-white/[0.03]`
                          }
                          style={
                            uiStyle === 'Metro Tiles'
                              ? { borderColor: active ? accentHex : 'rgba(255,255,255,0.08)' }
                              : undefined
                          }
                        >
                          <div className="min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: active ? accentHex : '#FFFFFF' }}
                            >
                              {track.title}
                            </p>
                            <p className="text-xs text-[#8E9AA9] truncate mt-0.5">
                              {track.artist} · {track.album}
                            </p>
                          </div>
                          <div className="text-right font-mono text-[11px] text-[#7A8492] tabular-nums shrink-0 mt-1">
                            <span>{track.format}</span>
                            <span className="mx-1.5">·</span>
                            <span>{track.durationSec ? formatTime(track.durationSec) : 'LOCAL'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {collectionView === 'videos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.07] pb-2.5">
                    <div>
                      <h2 className="font-display text-2xl font-normal lowercase text-white">videos</h2>
                      <p className="text-[11px] font-mono text-[#788290]">MP4 / MKV / WEBM local cinema</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCollectionView('root')}
                      className="text-xs text-[#94A0B2] hover:text-white flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> back
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {videoTracks.map((vid) => {
                      const active = vid.id === activeTrack?.id;
                      return (
                        <button
                          key={vid.id}
                          type="button"
                          onClick={() => {
                            playTrack(vid);
                            setPivot('nowplaying');
                          }}
                          className="p-4 rounded-none bg-[#0D1016] hover:bg-[#141A24] border border-white/[0.08] text-left space-y-2 transition-colors"
                          style={active ? { borderColor: accentHex } : undefined}
                        >
                          <div className="aspect-video bg-[#06080C] border border-white/[0.06] flex items-center justify-center">
                            <Film className="w-7 h-7" style={{ color: accentHex }} />
                          </div>
                          <p className="text-sm font-medium text-white truncate">{vid.title}</p>
                          <p className="text-[11px] font-mono text-[#7A8492]">
                            {vid.format} · {vid.bitrate}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {collectionView === 'spotify' && (
                <div className="space-y-5 max-w-md">
                  <h2 className="font-display text-2xl font-normal lowercase text-white">spotify</h2>
                  <p className="text-xs text-[#94A0B2] leading-relaxed">
                    Bridge your Spotify playlists into ZHD2&apos;s Metro interface or use the preinstalled Spotify desktop app on the SL8 dock.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSpotifyConnected((v) => !v)}
                    className="px-4 py-2.5 rounded-none text-xs font-semibold text-[#05080C] transition-colors"
                    style={{ backgroundColor: '#1DB954' }}
                  >
                    {spotifyConnected ? 'Disconnect Spotify Bridge' : 'Connect Spotify Account'}
                  </button>
                </div>
              )}

              {collectionView === 'pandora' && (
                <div className="space-y-4">
                  <h2 className="font-display text-2xl font-normal lowercase text-white">pandora &amp; live radio</h2>
                  <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
                    {RADIO_STATIONS.map((st) => {
                      const active = activeStation === st.id && isPlaying;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setActiveStation(st.id);
                            setIsPlaying(true);
                            startSynthPlayback(st.preset);
                          }}
                          className="w-full py-3.5 px-2 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-white">{st.name}</p>
                            <p className="text-[11px] font-mono text-[#7A8492]">{st.genre}</p>
                          </div>
                          <span className="text-xs font-mono" style={{ color: active ? '#2F6BFF' : '#7A8492' }}>
                            {active ? 'ON AIR' : 'TUNE IN'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {collectionView === 'settings' && (
                <div className="space-y-6">
                  <h2 className="font-display text-2xl font-normal lowercase text-white">settings</h2>

                  {/* Visualization Engine */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono tracking-[0.16em] text-[#7A8492]">
                      NOW PLAYING VISUALIZATION (SET TO NONE FOR SCREENSAVER)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {VISUALIZER_MODES.map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setVisualizer(mode)}
                          className="px-3 py-2 rounded-none text-xs border transition-colors"
                          style={{
                            borderColor: visualizer === mode ? accentHex : 'rgba(255,255,255,0.1)',
                            color: visualizer === mode ? accentHex : '#D5DCE6',
                            backgroundColor: visualizer === mode ? 'rgba(0,216,232,0.08)' : '#0C0F14',
                          }}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* UI Style */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono tracking-[0.16em] text-[#7A8492]">UI STYLE</p>
                    <div className="flex flex-wrap gap-2">
                      {(['Zune HD', 'Zune 30GB', 'Metro Tiles'] as const).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setUiStyle(style)}
                          className="px-3.5 py-2 rounded-none text-xs border transition-colors"
                          style={{
                            borderColor: uiStyle === style ? accentHex : 'rgba(255,255,255,0.1)',
                            color: uiStyle === style ? accentHex : '#D5DCE6',
                            backgroundColor: uiStyle === style ? 'rgba(0,216,232,0.08)' : '#0C0F14',
                          }}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent & Fonts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono tracking-[0.16em] text-[#7A8492]">ACCENT</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(ACCENT_PRESETS).map(([name, hex]) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setAccentName(name)}
                            className="px-3 py-1.5 rounded-none text-xs border flex items-center gap-2 bg-[#0C0F14]"
                            style={{
                              borderColor: accentName === name ? hex : 'rgba(255,255,255,0.1)',
                              color: accentName === name ? '#FFFFFF' : '#94A0B2',
                            }}
                          >
                            <span className="w-2.5 h-2.5" style={{ backgroundColor: hex }} />
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-mono tracking-[0.16em] text-[#7A8492]">FONTS</p>
                      <div className="flex gap-2">
                        {(['Metro Light', 'Clean Sans'] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setFontStyle(f)}
                            className="px-3 py-1.5 rounded-none text-xs border bg-[#0C0F14]"
                            style={{
                              borderColor: fontStyle === f ? accentHex : 'rgba(255,255,255,0.1)',
                              color: fontStyle === f ? accentHex : '#94A0B2',
                            }}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 5-Band Graphic Equalizer */}
                  <div className="space-y-3 pt-2 border-t border-white/[0.07]">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-mono tracking-[0.16em] text-[#7A8492]">EQUALIZER</p>
                      <div className="flex gap-1.5">
                        {Object.entries(EQ_PRESETS).map(([preset, vals]) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setActiveEqPreset(preset);
                              setEqGains([...vals]);
                            }}
                            className="px-2 py-1 rounded-none text-[11px] border bg-[#0C0F14]"
                            style={{
                              borderColor: activeEqPreset === preset ? accentHex : 'rgba(255,255,255,0.08)',
                              color: activeEqPreset === preset ? accentHex : '#94A0B2',
                            }}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      {EQ_BANDS.map((band, idx) => (
                        <label key={band.label} className="p-2.5 bg-[#0C0F14] border border-white/[0.07] space-y-2">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-[#8E9AA9]">{band.label}</span>
                            <span className="text-white tabular-nums">
                              {eqGains[idx] > 0 ? `+${eqGains[idx]}` : eqGains[idx]}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={-10}
                            max={10}
                            value={eqGains[idx]}
                            onChange={(e) => {
                              const next = [...eqGains];
                              next[idx] = Number(e.target.value);
                              setEqGains(next);
                              setActiveEqPreset('Custom');
                            }}
                            className="w-full accent-[#00D8E8] cursor-pointer"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {pivot === 'quickplay' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            <div>
              <p className="text-xs tracking-wider text-[#7A8492] lowercase">pinned &amp; recent</p>
              <h2 className="font-display text-3xl font-normal lowercase text-white mt-1">quickplay</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {tracks.map((track) => {
                const active = track.id === activeTrack?.id;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => {
                      playTrack(track);
                      setPivot('nowplaying');
                    }}
                    className="aspect-square p-4 rounded-none bg-[#0D1016] hover:bg-[#141A23] border text-left flex flex-col justify-between transition-colors"
                    style={{ borderColor: active ? accentHex : 'rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex items-center justify-between">
                      {track.mediaType === 'video' ? (
                        <Film className="w-5 h-5" style={{ color: accentHex }} />
                      ) : (
                        <Music className="w-5 h-5" style={{ color: accentHex }} />
                      )}
                      {track.pinned && <Pin className="w-3.5 h-3.5 text-[#7A8492]" />}
                    </div>
                    <div>
                      <p className="font-display text-base font-medium text-white line-clamp-2 leading-snug">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-[#8E9AA9] mt-1 truncate">{track.artist}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {pivot === 'services' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div>
              <p className="text-xs tracking-wider text-[#7A8492] lowercase">connected audio &amp; radio</p>
              <h2 className="font-display text-3xl font-normal lowercase text-white mt-1">services</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-none bg-[#0D1016] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl lowercase text-white">spotify</span>
                  <AudioLines className="w-5 h-5 text-[#1DB954]" />
                </div>
                <p className="text-xs text-[#8E9AA9]">
                  Stream personal playlists with ZHD2&apos;s Metro playback controls.
                </p>
                <button
                  type="button"
                  onClick={() => setSpotifyConnected((v) => !v)}
                  className="px-4 py-2 rounded-none text-xs font-semibold text-[#05080C]"
                  style={{ backgroundColor: '#1DB954' }}
                >
                  {spotifyConnected ? 'Connected' : 'Connect Account'}
                </button>
              </div>

              <div className="p-5 rounded-none bg-[#0D1016] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl lowercase text-white">pandora</span>
                  <Radio className="w-5 h-5 text-[#2F6BFF]" />
                </div>
                <p className="text-xs text-[#8E9AA9]">
                  Live internet radio stations routed through PipeWire with EQ.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPivot('zhd2');
                    setCollectionView('pandora');
                  }}
                  className="px-4 py-2 rounded-none text-xs font-semibold text-white bg-[#2F6BFF]"
                >
                  Browse Stations
                </button>
              </div>
            </div>
          </div>
        )}

        {pivot === 'nowplaying' && (
          <div className="flex-1 p-6 flex flex-col justify-between gap-4 overflow-y-auto">
            {activeTrack?.sourceType === 'local' && activeTrack.mediaType === 'video' ? (
              <video
                ref={videoRef}
                src={activeTrack.objectUrl}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onEnded={handleNext}
                className="flex-1 min-h-[260px] w-full bg-black object-contain border border-white/[0.08]"
              />
            ) : (
              <div className="flex-1 min-h-[260px] flex flex-col justify-between p-5 rounded-none bg-[#090B0F] border border-white/[0.08]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-mono tracking-[0.14em]" style={{ color: accentHex }}>
                      NOW PLAYING · {activeTrack?.format} · {activeTrack?.bitrate}
                    </p>
                    <h2 className="font-display text-3xl sm:text-4xl font-normal text-white mt-1.5">
                      {currentDisplayTitle}
                    </h2>
                    <p className="text-sm text-[#94A0B2] mt-1">{currentDisplaySub}</p>
                  </div>

                  {/* Visualization Switcher */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 mr-1" style={{ color: accentHex }} />
                    {VISUALIZER_MODES.map((mode) => {
                      const active = visualizer === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setVisualizer(mode)}
                          style={
                            active
                              ? { borderColor: accentHex, color: accentHex, backgroundColor: `${accentHex}1A` }
                              : undefined
                          }
                          className={`px-2.5 py-1 rounded-none border text-[11px] font-mono transition-colors ${
                            active ? '' : 'border-white/10 bg-[#0D1016] text-[#94A0B2] hover:text-white'
                          }`}
                        >
                          {mode}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {visualizer === 'None' ? (
                  <div className="flex-1 mt-5 border border-white/[0.07] bg-[#06070A] p-6 flex flex-col items-center justify-center text-center gap-3">
                    <Monitor className="w-7 h-7" style={{ color: accentHex }} />
                    <div className="space-y-1">
                      <p className="font-display text-base text-white">Visualization Off — Screensaver Armed</p>
                      <p className="text-xs font-mono text-[#8E9AA9] tabular-nums">
                        Staying on Now Playing activates ZHD2 Screensaver in {screensaverCountdown}s
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScreensaverActive(true)}
                      style={{ borderColor: accentHex, color: accentHex }}
                      className="px-4 py-1.5 rounded-none border text-xs font-mono hover:bg-white/[0.04] transition-colors"
                    >
                      Launch Screensaver Now
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-44 mt-4 border border-white/[0.05] bg-[#05070A] p-2">
                    <canvas ref={canvasRef} width={720} height={176} className="w-full h-full block" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Persistent ZHD2 Transport Bar */}
      <footer className="relative z-10 px-5 py-3 bg-[#090B0F] border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <button
          type="button"
          onClick={() => setPivot('nowplaying')}
          className="flex items-center gap-3 min-w-0 max-w-[240px] text-left group"
        >
          <span className="w-[3px] h-8 shrink-0" style={{ backgroundColor: accentHex }} />
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate group-hover:underline">
              {currentDisplayTitle}
            </p>
            <p className="text-[10px] font-mono text-[#7A8492] truncate">
              {activeStation ? 'LIVE RADIO' : activeTrack?.artist}
            </p>
          </div>
        </button>

        {/* Transport & Timeline */}
        <div className="flex-1 min-w-[240px] max-w-md flex flex-col gap-1.5">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShuffle((s) => !s)}
              aria-label="Shuffle"
              style={shuffle ? { color: accentHex } : undefined}
              className="p-1 text-[#7A8492] hover:text-white"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous"
              className="p-1 text-[#D5DCE6] hover:text-white"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              style={{ backgroundColor: accentHex }}
              className="w-8 h-8 rounded-none text-[#05080C] flex items-center justify-center"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next"
              className="p-1 text-[#D5DCE6] hover:text-white"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setRepeat((r) => !r)}
              aria-label="Repeat"
              style={repeat ? { color: accentHex } : undefined}
              className="p-1 text-[#7A8492] hover:text-white"
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-[#7A8492] tabular-nums">
            <span className="w-8 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={Math.max(1, duration)}
              step={0.5}
              value={Math.min(currentTime, Math.max(1, duration))}
              onChange={(e) => handleSeek(Number(e.target.value))}
              aria-label="Seek timeline"
              className="flex-1 accent-[#00D8E8] cursor-pointer h-1"
            />
            <span className="w-8">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
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
            aria-label="Volume"
            className="w-full accent-[#00D8E8] cursor-pointer h-1"
          />
        </div>
      </footer>
    </div>
  );
};
