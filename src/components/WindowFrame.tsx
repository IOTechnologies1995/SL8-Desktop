import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Minus, Square, X, Minimize2 } from 'lucide-react';
import { WindowInstance } from '../types/os';
import { APP_DEFINITIONS } from '../data/initialState';
import { AppIcon } from './AppIcons';

interface WindowFrameProps {
  win: WindowInstance;
  isFocused: boolean;
  reduceTransparency: boolean;
  dockPosition: 'bottom' | 'left' | 'right';
  touchMode: boolean;
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onToggleMaximize: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  children: React.ReactNode;
}

const TOP_BAR_HEIGHT = 38;

export const WindowFrame: React.FC<WindowFrameProps> = ({
  win,
  isFocused,
  reduceTransparency,
  dockPosition,
  touchMode,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onMove,
  onResize,
  children,
}) => {
  const [isInteracting, setIsInteracting] = useState(false);

  const dragState = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const resizeState = useRef<{
    startX: number;
    startY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const appDef = APP_DEFINITIONS[win.appId];

  const handleTitlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    onFocus(win.id);
    if (win.isMaximized) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    setIsInteracting(true);
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: win.x,
      origY: win.y,
    };
  };

  const handleTitlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const nextX = Math.max(-win.width + 140, Math.min(window.innerWidth - 140, dragState.current.origX + dx));
    const nextY = Math.max(TOP_BAR_HEIGHT + 2, Math.min(window.innerHeight - 96, dragState.current.origY + dy));
    onMove(win.id, nextX, nextY);
  };

  const handleTitlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragState.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragState.current = null;
      setIsInteracting(false);
    }
  };

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (win.isMaximized) return;
    e.stopPropagation();
    onFocus(win.id);
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsInteracting(true);
    resizeState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origW: win.width,
      origH: win.height,
    };
  };

  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeState.current) return;
    const dx = e.clientX - resizeState.current.startX;
    const dy = e.clientY - resizeState.current.startY;
    const minW = appDef?.minWidth ?? 360;
    const minH = appDef?.minHeight ?? 340;
    const maxW = window.innerWidth - win.x - 8;
    const maxH = window.innerHeight - win.y - 8;
    onResize(
      win.id,
      Math.max(minW, Math.min(maxW, resizeState.current.origW + dx)),
      Math.max(minH, Math.min(maxH, resizeState.current.origH + dy))
    );
  };

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (resizeState.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      resizeState.current = null;
      setIsInteracting(false);
    }
  };

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 900;

  const maxLeft = dockPosition === 'left' ? 74 : 0;
  const maxRight = dockPosition === 'right' ? 74 : 0;
  const maxBottom = dockPosition === 'bottom' ? 74 : 0;

  const targetX = win.isMaximized ? maxLeft : win.x;
  const targetY = win.isMaximized ? TOP_BAR_HEIGHT : win.y;
  const targetW = win.isMaximized ? vw - maxLeft - maxRight : win.width;
  const targetH = win.isMaximized ? vh - TOP_BAR_HEIGHT - maxBottom : win.height;

  const btnSizeClass = touchMode ? 'w-10 h-10' : 'w-8 h-8';

  return (
    <motion.section
      aria-label={win.title}
      onPointerDown={() => onFocus(win.id)}
      initial={{
        opacity: 0,
        scale: 0.94,
        x: targetX,
        y: targetY + 18,
        width: targetW,
        height: targetH,
      }}
      animate={
        win.isMinimized
          ? {
              opacity: 0,
              scale: 0.82,
              x: targetX,
              y: vh - 60,
              width: targetW,
              height: targetH,
            }
          : {
              opacity: 1,
              scale: 1,
              x: targetX,
              y: targetY,
              width: targetW,
              height: targetH,
            }
      }
      exit={{
        opacity: 0,
        scale: 0.94,
        y: targetY + 12,
        transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
      }}
      transition={
        isInteracting
          ? { duration: 0 }
          : {
              duration: 0.22,
              ease: [0.16, 1, 0.3, 1],
            }
      }
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: win.zIndex,
        pointerEvents: win.isMinimized ? 'none' : 'auto',
        borderColor: isFocused ? 'var(--sl8-accent-border)' : 'rgba(255, 255, 255, 0.14)',
      }}
      className={`flex flex-col rounded-none overflow-hidden border ${
        reduceTransparency ? 'bg-[#090B10]' : 'bg-[#080B10]/88 backdrop-blur-2xl'
      } ${
        isFocused
          ? 'shadow-[0_26px_72px_rgba(0,0,0,0.82),inset_0_1px_0_rgba(255,255,255,0.16)]'
          : 'shadow-[0_16px_42px_rgba(0,0,0,0.58)]'
      }`}
    >
      {/* Sharp Frosted Glass Window Title Bar */}
      <div
        onPointerDown={handleTitlePointerDown}
        onPointerMove={handleTitlePointerMove}
        onPointerUp={handleTitlePointerUp}
        onDoubleClick={() => onToggleMaximize(win.id)}
        className={`${touchMode ? 'h-11' : 'h-10'} shrink-0 flex items-center justify-between px-3 select-none touch-none border-b border-white/[0.12] ${
          reduceTransparency ? 'bg-[#10141D]' : 'sl8-frosted-titlebar'
        } ${win.isMaximized ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <AppIcon appId={win.appId} size={18} className="shrink-0" />
          <span
            className={`font-display text-[13px] font-medium tracking-wide truncate ${
              isFocused ? 'text-white' : 'text-[#9CA7B8]'
            }`}
          >
            {win.title}
          </span>
        </div>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onMinimize(win.id)}
            aria-label={`Minimize ${win.title}`}
            className={`${btnSizeClass} rounded-none flex items-center justify-center text-[#A7B2C2] hover:text-white hover:bg-white/12 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--sl8-accent)]`}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onToggleMaximize(win.id)}
            aria-label={win.isMaximized ? `Restore ${win.title}` : `Maximize ${win.title}`}
            className={`${btnSizeClass} rounded-none flex items-center justify-center text-[#A7B2C2] hover:text-white hover:bg-white/12 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--sl8-accent)]`}
          >
            {win.isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Square className="w-3 h-3" />}
          </button>
          <button
            type="button"
            onClick={() => onClose(win.id)}
            aria-label={`Close ${win.title}`}
            className={`${btnSizeClass} rounded-none flex items-center justify-center text-[#A7B2C2] hover:text-white hover:bg-red-500/35 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--sl8-accent)]`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Window Content Viewport */}
      <div className="flex-1 min-h-0 overflow-hidden relative bg-[#080A0F]">{children}</div>

      {/* Sharp Bottom-Right Touch-Friendly Resize Handle */}
      {!win.isMaximized && (
        <div
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          aria-label="Resize window"
          className={`absolute bottom-0 right-0 ${
            touchMode ? 'w-7 h-7' : 'w-4 h-4'
          } cursor-nwse-resize touch-none z-20 group flex items-end justify-end p-1`}
        >
          <span className="block w-2.5 h-2.5 border-r-2 border-b-2 border-white/30 group-hover:border-[var(--sl8-accent)] transition-colors" />
        </div>
      )}
    </motion.section>
  );
};
