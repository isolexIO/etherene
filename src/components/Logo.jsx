import React from 'react';

// Solana-inspired mark: three parallel diagonal bars with the signature
// purple-to-green gradient, framed as an "E" (Etherene) node.
export default function Logo({ className = "w-8 h-8" }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="solGradient" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
        <filter id="solGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#solGlow)" transform="rotate(-45 50 50)">
        {/* Three Solana-style parallel bars */}
        <rect x="22" y="30" width="56" height="9" rx="4.5" fill="url(#solGradient)" />
        <rect x="22" y="45.5" width="56" height="9" rx="4.5" fill="url(#solGradient)" />
        <rect x="22" y="61" width="56" height="9" rx="4.5" fill="url(#solGradient)" />
      </g>
    </svg>
  );
}