import React from 'react';

export const ShieldLogo: React.FC<{ size?: number }> = ({ size = 48 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="shieldClip">
          <path d="M24 2L6 8V22C6 32 12 40 24 46C36 40 42 32 42 22V8L24 2Z" />
        </clipPath>
      </defs>
      
      {/* Shield shape with four quadrants */}
      <g clipPath="url(#shieldClip)">
        {/* Top-left quadrant - Red */}
        <rect x="0" y="0" width="24" height="24" fill="#EF4444" />
        {/* Top-right quadrant - Yellow */}
        <rect x="24" y="0" width="24" height="24" fill="#F59E0B" />
        {/* Bottom-left quadrant - Blue */}
        <rect x="0" y="24" width="24" height="24" fill="#3B82F6" />
        {/* Bottom-right quadrant - Green */}
        <rect x="24" y="24" width="24" height="24" fill="#10B981" />
      </g>
      
      {/* Shield border */}
      <path
        d="M24 2L6 8V22C6 32 12 40 24 46C36 40 42 32 42 22V8L24 2Z"
        fill="none"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="0.5"
      />
      
      {/* Checkmark */}
      <path
        d="M18 24L22 28L30 20"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

