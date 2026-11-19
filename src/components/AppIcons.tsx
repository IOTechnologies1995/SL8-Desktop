import React from 'react';
import { AppId } from '../types/os';

interface AppIconProps {
  appId: AppId | 'sl8';
  size?: number;
  className?: string;
}

const GlassPlate: React.FC<{ accentBorder?: boolean }> = ({ accentBorder }) => (
  <>
    <rect
      x="1"
      y="1"
      width="30"
      height="30"
      rx="0"
      fill="rgba(12, 16, 23, 0.88)"
      stroke={accentBorder ? 'var(--sl8-accent)' : 'rgba(255,255,255,0.2)'}
      strokeWidth="1.2"
    />
    <path d="M1.6 1.6H30.4M1.6 1.6V14" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" />
  </>
);

export const SL8_LOGO_SRC = '/assets/aistudio/SL8Future_c112cf52.png';

export const AppIcon: React.FC<AppIconProps> = ({ appId, size = 24, className = '' }) => {
  const svgClass = `sl8-icon-svg ${className}`.trim();
  switch (appId) {
    case 'sl8':
      return (
        <span
          style={{ width: size, height: size }}
          className={`relative inline-flex items-center justify-center overflow-hidden rounded-none bg-[#05070B] border border-[var(--sl8-accent-border)] shrink-0 ${svgClass}`}
          aria-hidden="true"
        >
          <img
            src={SL8_LOGO_SRC}
            alt=""
            draggable={false}
            className="w-full h-full object-cover object-[50%_18%] scale-[1.28] select-none pointer-events-none"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]"
          />
        </span>
      );

    case 'netcom':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={svgClass} aria-hidden="true">
          <GlassPlate />
          <circle cx="16" cy="16" r="8" stroke="#FFFFFF" strokeWidth="1.4" />
          <ellipse cx="16" cy="16" rx="3.8" ry="8" stroke="var(--sl8-accent)" strokeWidth="1.4" />
          <path d="M8.5 16H23.5" stroke="#94A0B2" strokeWidth="1.2" />
        </svg>
      );

    case 'zhd2':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={svgClass} aria-hidden="true">
          <GlassPlate />
          <path d="M12.5 10L22.5 16L12.5 22V10Z" stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="miter" />
          <path d="M8 12V20M24.5 11V21" stroke="var(--sl8-accent)" strokeWidth="1.6" />
        </svg>
      );

    case 'centurion':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={svgClass} aria-hidden="true">
          <GlassPlate />
          <path
            d="M16 6.5L23.5 9.8V16.2C23.5 20.8 20.2 24.4 16 25.8C11.8 24.4 8.5 20.8 8.5 16.2V9.8L16 6.5Z"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
          <path d="M16 9.5V22.5M11.5 14H20.5" stroke="var(--sl8-accent)" strokeWidth="1.5" />
        </svg>
      );

    case 'spotify':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={svgClass} aria-hidden="true">
          <GlassPlate />
          <path d="M9.5 12.2C14 10.6 19.2 10.9 23 12.8" stroke="#1DB954" strokeWidth="1.8" />
          <path d="M10.5 16.2C14.2 15 18.5 15.2 21.8 16.8" stroke="#FFFFFF" strokeWidth="1.6" />
          <path d="M11.5 20.2C14.5 19.3 17.8 19.5 20.4 20.8" stroke="#1DB954" strokeWidth="1.5" />
        </svg>
      );

    case 'steam':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={svgClass} aria-hidden="true">
          <GlassPlate />
          <circle cx="20.5" cy="12" r="4" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="20.5" cy="12" r="1.5" fill="var(--sl8-accent)" />
          <circle cx="11.5" cy="20.5" r="3" stroke="var(--sl8-accent)" strokeWidth="1.5" />
          <path d="M14 18.5L17.5 14.5M7 18L10 19.5" stroke="#FFFFFF" strokeWidth="1.6" />
        </svg>
      );

    case 'calculator':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={svgClass} aria-hidden="true">
          <GlassPlate />
          <rect x="8.5" y="7.5" width="15" height="5" stroke="var(--sl8-accent)" strokeWidth="1.3" />
          <rect x="8.5" y="15.5" width="4" height="3.5" fill="#FFFFFF" />
          <rect x="14" y="15.5" width="4" height="3.5" fill="#94A0B2" />
          <rect x="19.5" y="15.5" width="4" height="3.5" fill="var(--sl8-accent)" />
          <rect x="8.5" y="21" width="4" height="3.5" fill="#94A0B2" />
          <rect x="14" y="21" width="4" height="3.5" fill="#FFFFFF" />
          <rect x="19.5" y="21" width="4" height="3.5" fill="var(--sl8-accent)" />
        </svg>
      );

    case 'calendar':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={svgClass} aria-hidden="true">
          <GlassPlate />
          <rect x="7.5" y="9.5" width="17" height="15" stroke="#FFFFFF" strokeWidth="1.4" />
          <path d="M7.5 14H24.5M12 7V11M20 7V11" stroke="var(--sl8-accent)" strokeWidth="1.5" />
          <rect x="11" y="17" width="3" height="3" fill="var(--sl8-accent)" />
          <rect x="16" y="17" width="3" height="3" fill="#94A0B2" />
        </svg>
      );

    case 'notes':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={svgClass} aria-hidden="true">
          <GlassPlate />
          <rect x="8.5" y="7.5" width="15" height="17" stroke="#FFFFFF" strokeWidth="1.4" />
          <path d="M11.5 12H20.5M11.5 16H20.5M11.5 20H17" stroke="var(--sl8-accent)" strokeWidth="1.4" />
        </svg>
      );

    case 'terminal':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={svgClass} aria-hidden="true">
          <GlassPlate />
          <path d="M9 12L14 16L9 20" stroke="var(--sl8-accent)" strokeWidth="1.8" />
          <path d="M16.5 20H23" stroke="#FFFFFF" strokeWidth="1.8" />
        </svg>
      );

    case 'files':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={svgClass} aria-hidden="true">
          <GlassPlate />
          <path d="M7.5 9.5H14L16 11.8H24.5V23H7.5V9.5Z" stroke="#FFFFFF" strokeWidth="1.4" />
          <rect x="13.5" y="15.5" width="5" height="4" stroke="var(--sl8-accent)" strokeWidth="1.4" />
        </svg>
      );

    case 'packages':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={svgClass} aria-hidden="true">
          <GlassPlate />
          <path d="M16 7.5L23.5 11.8V20.2L16 24.5L8.5 20.2V11.8L16 7.5Z" stroke="#FFFFFF" strokeWidth="1.4" />
          <path d="M8.5 11.8L16 16L23.5 11.8M16 16V24.5" stroke="var(--sl8-accent)" strokeWidth="1.4" />
        </svg>
      );

    case 'settings':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={svgClass} aria-hidden="true">
          <GlassPlate />
          <path d="M8.5 11.5H23.5M8.5 16H23.5M8.5 20.5H23.5" stroke="#94A0B2" strokeWidth="1.4" />
          <rect x="11" y="9.5" width="4" height="4" fill="#0B0E14" stroke="var(--sl8-accent)" strokeWidth="1.4" />
          <rect x="17.5" y="14" width="4" height="4" fill="#0B0E14" stroke="#FFFFFF" strokeWidth="1.4" />
          <rect x="12.5" y="18.5" width="4" height="4" fill="#0B0E14" stroke="#FFFFFF" strokeWidth="1.4" />
        </svg>
      );
  }
};
