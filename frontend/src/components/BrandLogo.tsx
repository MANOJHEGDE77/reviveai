import React from 'react';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  subtitleText?: string;
  theme?: 'dark' | 'light' | 'auto';
  className?: string;
  animate?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = true,
  subtitleText = 'AUTONOMOUS V2.0',
  theme = 'light',
  className = '',
  animate = true,
}) => {
  // Dimensions map
  const sizeMap = {
    xs: { box: 'w-6 h-6', text: 'text-xs', sub: 'text-[8px]', spark: 'hidden' },
    sm: { box: 'w-8 h-8', text: 'text-sm', sub: 'text-[9px]', spark: 'w-2 h-2' },
    md: { box: 'w-10 h-10', text: 'text-base', sub: 'text-[10px]', spark: 'w-2.5 h-2.5' },
    lg: { box: 'w-12 h-12', text: 'text-xl', sub: 'text-[11px]', spark: 'w-3 h-3' },
    xl: { box: 'w-16 h-16', text: 'text-2xl', sub: 'text-xs', spark: 'w-4 h-4' },
  };

  const current = sizeMap[size] || sizeMap.md;

  const textColor = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';

  return (
    <div className={`inline-flex items-center gap-3 group select-none ${className}`}>
      {/* 1. Kinetic Insignia Icon */}
      <div
        className={`relative ${current.box} rounded-xl shrink-0 p-0.5 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.35)]`}
      >
        {/* Ambient Gradient Aura on Hover */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4F46E5] via-[#06B6D4] to-[#10B981] rounded-xl opacity-30 group-hover:opacity-75 blur-[3px] transition duration-300" />

        {/* Master Vector Insignia */}
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-full rounded-xl overflow-hidden"
        >
          <defs>
            <linearGradient id={`brandBg-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0B0F19" />
              <stop offset="50%" stop-color="#0F172A" />
              <stop offset="100%" stop-color="#020617" />
            </linearGradient>

            <linearGradient id={`brandBorder-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.8" />
              <stop offset="50%" stop-color="#818CF8" stop-opacity="0.4" />
              <stop offset="100%" stop-color="#10B981" stop-opacity="0.7" />
            </linearGradient>

            <linearGradient id={`ribbon-${size}`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#4F46E5" />
              <stop offset="35%" stop-color="#3B82F6" />
              <stop offset="75%" stop-color="#06B6D4" />
              <stop offset="100%" stop-color="#38BDF8" />
            </linearGradient>

            <linearGradient id={`arrow-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#06B6D4" />
              <stop offset="50%" stop-color="#10B981" />
              <stop offset="100%" stop-color="#34D399" />
            </linearGradient>

            <radialGradient id={`glow-${size}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#06B6D4" stop-opacity="0.4" />
              <stop offset="70%" stop-color="#3B82F6" stop-opacity="0.1" />
              <stop offset="100%" stop-color="#0F172A" stop-opacity="0" />
            </radialGradient>

            <filter id={`dropGlow-${size}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#06B6D4" flood-opacity="0.5" />
            </filter>
          </defs>

          {/* Squircle Chassis */}
          <rect
            x="2"
            y="2"
            width="60"
            height="60"
            rx="16"
            fill={`url(#brandBg-${size})`}
            stroke={`url(#brandBorder-${size})`}
            strokeWidth="1.75"
          />

          {/* Core Radiance */}
          <circle cx="32" cy="32" r="22" fill={`url(#glow-${size})`} />

          {/* Micro Telemetry Constellation Dots */}
          <circle cx="15" cy="15" r="1.2" fill="#38BDF8" opacity="0.4" />
          <circle cx="49" cy="15" r="1.2" fill="#38BDF8" opacity="0.4" />
          <circle cx="15" cy="49" r="1.2" fill="#38BDF8" opacity="0.4" />
          <circle cx="49" cy="49" r="1.2" fill="#10B981" opacity="0.4" />

          {/* Glyphs */}
          <g filter={`url(#dropGlow-${size})`}>
            {/* Pillar */}
            <path
              d="M 17 46 L 17 19 C 17 17.343 18.343 16 20 16 L 22.5 16 C 23.881 16 25 17.119 25 18.5 L 25 43.5 C 25 44.881 23.881 46 22.5 46 Z"
              fill={`url(#ribbon-${size})`}
            />

            {/* Continuous Loop */}
            <path
              d="M 23 16 L 33 16 C 39.075 16 43.5 20.425 43.5 26.5 C 43.5 32.575 39.075 36 33 36 L 24 36 C 22.895 36 22 35.105 22 34 L 22 31 C 22 29.895 22.895 29 24 29 L 32.5 29 C 35.261 29 37 27.657 37 25.5 C 37 23.343 35.261 22 32.5 22 L 23 22 Z"
              fill={`url(#ribbon-${size})`}
            />

            {/* Ascending Recovery Velocity Arrow */}
            <path
              d="M 29.5 32.5 L 41.5 44.8 C 42.4 45.7 43.9 45.4 44.4 44.2 L 47 38 L 41 38.5 L 34 31 Z"
              fill={`url(#arrow-${size})`}
            />

            {/* AI Decision Spark */}
            <polygon
              points="45,14 47.5,18 51.5,20.5 47.5,23 45,27 42.5,23 38.5,20.5 42.5,18"
              fill="#38BDF8"
              opacity="0.95"
            />
            <circle cx="45" cy="20.5" r="1.5" fill="#FFFFFF" />
          </g>
        </svg>
      </div>

      {/* 2. Bespoke Brand Typography */}
      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-heading font-black tracking-tight ${textColor} ${current.text} leading-none`}
            >
              REVIVE
            </span>
            {/* AI Pill Badge */}
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white font-mono font-black text-[10px] tracking-wider uppercase shadow-[0_0_8px_rgba(6,182,212,0.4)] leading-tight">
              AI
            </span>
          </div>

          {showSubtitle && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10B981]" />
              </span>
              <span
                className={`font-mono font-bold tracking-wider text-[#059669] ${current.sub} uppercase`}
              >
                {subtitleText}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
