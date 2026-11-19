import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SL8_LOGO_SRC } from './AppIcons';

interface BootSequenceProps {
  visible: boolean;
  onComplete: () => void;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ visible, onComplete }) => {
  const [phase, setPhase] = useState<'ignite' | 'welcome' | 'exit'>('ignite');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setPhase('ignite');
    setProgress(0);

    const p1 = setTimeout(() => setProgress(38), 220);
    const p2 = setTimeout(() => setProgress(76), 780);
    const p3 = setTimeout(() => setProgress(100), 1320);
    const tWelcome = setTimeout(() => setPhase('welcome'), 1550);
    const tExit = setTimeout(() => setPhase('exit'), 3950);
    const tDone = setTimeout(() => onComplete(), 4550);

    return () => {
      clearTimeout(p1);
      clearTimeout(p2);
      clearTimeout(p3);
      clearTimeout(tWelcome);
      clearTimeout(tExit);
      clearTimeout(tDone);
    };
  }, [visible, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="sl8-boot-overlay"
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'exit' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[120] bg-[#020305] flex flex-col items-center justify-center overflow-hidden select-none px-6"
        >
          {/* Ambient Cyan/Accent Radial Energy Field */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{
              opacity: phase === 'ignite' ? [0.15, 0.55, 0.38] : 0.45,
              scale: phase === 'ignite' ? [0.75, 1.08, 1] : 1.05,
            }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 44%, rgba(0, 229, 255, 0.16) 0%, rgba(0, 229, 255, 0.04) 30%, rgba(2, 3, 5, 1) 70%)',
            }}
          />

          {/* Subtle Precision Grid Hairlines */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />

          {/* Center Official SL8 OS Animated Emblem + Boot Stages */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-2xl w-full">
            {/* Animated Official SL8 OS Logo Stage */}
            <motion.div
              animate={{
                scale: phase === 'welcome' ? 0.88 : 1,
                y: phase === 'welcome' ? -10 : 0,
              }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-52 h-52 sm:w-64 sm:h-64 mb-5 flex items-center justify-center"
            >
              {/* Outer Rotating HUD Calibration Arcs aligned to the emblem center (y=41%) */}
              <svg
                viewBox="0 0 240 240"
                className="pointer-events-none absolute inset-0 w-full h-full overflow-visible"
                aria-hidden="true"
              >
                {/* Rotating outer segmented reticle ring */}
                <motion.g
                  style={{ originX: '120px', originY: '98px' }}
                  initial={{ rotate: -65, opacity: 0, scale: 1.24 }}
                  animate={{ rotate: 0, opacity: [0, 0.85, 0.25], scale: 1 }}
                  transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <circle
                    cx="120"
                    cy="98"
                    r="86"
                    fill="none"
                    stroke="var(--sl8-accent)"
                    strokeWidth="1.2"
                    strokeDasharray="34 18 10 18"
                  />
                </motion.g>

                {/* Counter-rotating inner calibration ring */}
                <motion.g
                  style={{ originX: '120px', originY: '98px' }}
                  initial={{ rotate: 95, opacity: 0, scale: 0.72 }}
                  animate={{ rotate: 0, opacity: [0, 0.9, 0.2], scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                >
                  <circle
                    cx="120"
                    cy="98"
                    r="62"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeOpacity="0.65"
                    strokeWidth="1"
                    strokeDasharray="18 22 6 14"
                  />
                </motion.g>

                {/* Three Converging Energy Beams matching the 3 arrows of the official SL8 logo */}
                {[
                  { x1: 120, y1: 14, x2: 120, y2: 76 },
                  { x1: 46, y1: 140, x2: 100, y2: 109 },
                  { x1: 194, y1: 140, x2: 140, y2: 109 },
                ].map((vec, idx) => (
                  <motion.line
                    key={idx}
                    x1={vec.x1}
                    y1={vec.y1}
                    x2={vec.x2}
                    y2={vec.y2}
                    stroke="#FFFFFF"
                    strokeWidth="2.2"
                    strokeLinecap="square"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
                    transition={{
                      duration: 0.85,
                      delay: 0.42 + idx * 0.06,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                ))}

                {/* Center Core Ignition Shockwave */}
                <motion.circle
                  cx="120"
                  cy="98"
                  r="14"
                  fill="none"
                  stroke="var(--sl8-accent)"
                  strokeWidth="2"
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{ scale: [0.2, 3.6], opacity: [0, 0.95, 0] }}
                  transition={{ duration: 0.95, delay: 0.95, ease: 'easeOut' }}
                  style={{ originX: '120px', originY: '98px' }}
                />
              </svg>

              {/* Official SL8 OS Logo with Scanline Reveal & Luminous Glow */}
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.9,
                  clipPath: 'inset(0% 0% 100% 0%)',
                  filter: 'brightness(1.8) drop-shadow(0 0 28px rgba(0,229,255,0.9))',
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  clipPath: 'inset(0% 0% 0% 0%)',
                  filter:
                    phase === 'welcome'
                      ? 'brightness(1.08) drop-shadow(0 0 24px rgba(0,229,255,0.55))'
                      : 'brightness(1.18) drop-shadow(0 0 32px rgba(0,229,255,0.75))',
                }}
                transition={{ duration: 1.05, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full h-full flex items-center justify-center"
              >
                <img
                  src={SL8_LOGO_SRC}
                  alt="SL8 OS Official Logo"
                  draggable={false}
                  className="w-full h-full object-contain mix-blend-screen select-none pointer-events-none"
                />
              </motion.div>

              {/* Crisp Horizontal Laser Scan Beam sweeping down during logo reveal */}
              <motion.div
                aria-hidden="true"
                initial={{ top: '4%', opacity: 0 }}
                animate={{ top: ['4%', '94%'], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.05, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-none absolute left-2 right-2 h-[2px]"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, var(--sl8-accent) 30%, #FFFFFF 50%, var(--sl8-accent) 70%, transparent 100%)',
                  boxShadow: '0 0 18px var(--sl8-accent)',
                }}
              />
            </motion.div>

            {/* Boot Stages Text */}
            <AnimatePresence mode="wait">
              {phase === 'ignite' ? (
                <motion.div
                  key="boot-ignite"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-sm space-y-3.5"
                >
                  <p className="text-xs font-mono tracking-wider text-[#94A0B2]">
                    Ubuntu 26.04 LTS · Kernel 6.12.8-sl8-hardened
                  </p>

                  {/* Minimalist Precision Boot Bar */}
                  <div className="h-[2px] w-full bg-white/10 rounded-none overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 ease-out"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: 'var(--sl8-accent)',
                        boxShadow: '0 0 12px var(--sl8-accent)',
                      }}
                    />
                  </div>

                  <p className="text-[11px] font-mono text-[#7F8B9B] tabular-nums">
                    {progress < 50
                      ? 'Verifying LUKS2 encrypted root volume...'
                      : progress < 90
                      ? 'Enforcing Centurion AppArmor & nftables policies...'
                      : 'Initializing SL8 Frosted Glass Wayland Compositor...'}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="boot-welcome"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-4 flex flex-col items-center"
                >
                  <h1
                    className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-white"
                    style={{ textWrap: 'balance' }}
                  >
                    Your Personal Gateway Experience
                  </h1>

                  {/* Delicate Accent Horizon Line */}
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      background:
                        'linear-gradient(90deg, transparent 0%, var(--sl8-accent) 50%, transparent 100%)',
                    }}
                    className="h-px w-64"
                  />

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-xs font-mono tracking-widest text-[#94A0B2]"
                  >
                    SL8 DSK EXPERIMENTAL BUILD
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quiet Skip Control */}
          <button
            type="button"
            onClick={onComplete}
            className="absolute bottom-6 right-6 z-20 px-3 py-1.5 rounded-none border border-white/10 text-[11px] font-mono text-[#6B7687] hover:text-white hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--sl8-accent)]"
          >
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
