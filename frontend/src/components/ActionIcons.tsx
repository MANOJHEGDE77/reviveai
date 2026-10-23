import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Editorial Simulation Catalyst Icon
 * Precision emerald and dark slate vector
 */
export const SimulateFailureIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="#DCD8CF"
        strokeWidth="1.5"
      />
      <path
        d="M 13 4 L 7.5 12.5 H 12 L 11 20 L 16.5 11.5 H 12 L 13 4 Z"
        fill="#168F5A"
      />
    </svg>
  );
};

/**
 * Editorial Ingestion Intake Icon
 */
export const InjectIncidentIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="4"
        stroke="#DCD8CF"
        strokeWidth="1.5"
      />
      <path
        d="M 12 7 V 17 M 7 12 H 17"
        stroke="#168F5A"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};
