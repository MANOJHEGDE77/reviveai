import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Modern Cybernetic Simulation Catalyst Icon
 * Multi-layer electric amber/violet vector with kinetic energy spark
 */
export const SimulateFailureIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <defs>
        <linearGradient id="simGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id="simRingGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#EC4899" stopOpacity="0.8" />
        </linearGradient>
        <filter id="simGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#F43F5E" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Orbiting Tech Ring */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="url(#simRingGrad)"
        strokeWidth="1.75"
        strokeDasharray="2 3"
        className="animate-[spin_8s_linear_infinite]"
      />

      {/* Outer Hexagon / Kinetic Shield Nodes */}
      <circle cx="12" cy="3" r="1.25" fill="#F59E0B" />
      <circle cx="19.8" cy="7.5" r="1.25" fill="#F43F5E" />
      <circle cx="19.8" cy="16.5" r="1.25" fill="#EC4899" />
      <circle cx="12" cy="21" r="1.25" fill="#A855F7" />
      <circle cx="4.2" cy="16.5" r="1.25" fill="#F43F5E" />
      <circle cx="4.2" cy="7.5" r="1.25" fill="#F59E0B" />

      {/* Central Supercharged Lightning / Flux Spark */}
      <path
        d="M 13.2 5.5 L 7.5 12.8 C 7.2 13.2 7.5 13.8 8 13.8 L 11.5 13.8 L 10.8 18.5 C 10.6 19.1 11.4 19.4 11.8 18.9 L 16.5 11.2 C 16.8 10.8 16.5 10.2 16 10.2 L 12.8 10.2 L 13.8 5.8 C 13.9 5.3 13.5 4.9 13.2 5.5 Z"
        fill="url(#simGrad)"
        filter="url(#simGlow)"
      />
    </svg>
  );
};

/**
 * Modern Neural Ingestion Portal Icon
 * Inbound data packet stream fusing into active intake node
 */
export const InjectIncidentIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <defs>
        <linearGradient id="injectGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="packetGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
        <filter id="injectGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#06B6D4" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Target Radar Base / Ingestion Perimeter */}
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5.5"
        stroke="url(#injectGrad)"
        strokeWidth="1.5"
        strokeDasharray="4 2"
        opacity="0.8"
      />

      {/* Ingestion Stream Diamond / Core Intake Portal */}
      <g filter="url(#injectGlow)">
        {/* Diamond Node */}
        <polygon
          points="12,6 18,12 12,18 6,12"
          fill="url(#injectGrad)"
          opacity="0.25"
        />
        <polygon
          points="12,7.5 16.5,12 12,16.5 7.5,12"
          stroke="url(#packetGrad)"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Central Plus / Telemetry Capture Reticle */}
        <path
          d="M 12 9 L 12 15 M 9 12 L 15 12"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Outer Inbound Ingestion Vector Arrows */}
        <circle cx="12" cy="12" r="1.5" fill="#38BDF8" />
      </g>
    </svg>
  );
};
