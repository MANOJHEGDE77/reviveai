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
  subtitleText = 'AUTONOMOUS REVENUE RECOVERY',
  theme = 'light',
  className = '',
}) => {
  // Dimensions map
  const sizeMap = {
    xs: { box: 'w-6 h-6', text: 'text-xs', sub: 'text-[8px]' },
    sm: { box: 'w-8 h-8', text: 'text-sm', sub: 'text-[9px]' },
    md: { box: 'w-9 h-9', text: 'text-base', sub: 'text-[10px]' },
    lg: { box: 'w-11 h-11', text: 'text-xl', sub: 'text-[11px]' },
    xl: { box: 'w-14 h-14', text: 'text-2xl', sub: 'text-xs' },
  };

  const current = sizeMap[size] || sizeMap.md;
  const textColor = theme === 'dark' ? 'text-white' : 'text-[#111216]';

  return (
    <div className={`inline-flex items-center gap-3 group select-none ${className}`}>
      {/* 1. Precision Insignia Icon */}
      <div
        className={`relative ${current.box} rounded-xl shrink-0 p-1 bg-[#111216] text-white flex items-center justify-center transition-all duration-200 border border-[#2E3138] group-hover:border-[#168F5A]`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Recovery Loop Path */}
          <path
            d="M8 12C8 9.79086 9.79086 8 12 8H20C22.2091 8 24 9.79086 24 12V13.5C24 15.7091 22.2091 17.5 20 17.5H12C9.79086 17.5 8 19.2909 8 21.5V24"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Ascending Arrow Tip */}
          <path
            d="M19 24L24 19L24 24H19Z"
            fill="#168F5A"
          />
          <circle cx="20" cy="12.75" r="1.75" fill="#168F5A" />
        </svg>
      </div>

      {/* 2. Editorial Wordmark */}
      {showText && (
        <div className="flex flex-col justify-center leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-heading font-bold tracking-[-0.03em] ${textColor} ${current.text}`}
            >
              Revive<span className="text-[#168F5A]">AI</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono font-bold tracking-wider uppercase bg-[#EAF5EE] text-[#168F5A] border border-[#B9E2CD]">
              AGENT
            </span>
          </div>

          {showSubtitle && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#168F5A]" />
              <span
                className={`font-mono font-medium tracking-[0.14em] text-[#666A6B] ${current.sub} uppercase`}
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
