import React from 'react';

export default function Logo({ className = "w-8 h-8" }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#00FFFF', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FF00FF', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Hexagonal cube network - top center */}
      <g filter="url(#glow)">
        {/* Top cube */}
        <circle cx="50" cy="25" r="5" fill="#FF00FF" opacity="0.8" />
        <line x1="50" y1="25" x2="35" y2="38" stroke="#00FFFF" strokeWidth="2.5" opacity="0.9" />
        <line x1="50" y1="25" x2="65" y2="38" stroke="#00FFFF" strokeWidth="2.5" opacity="0.9" />

        {/* Left-top cube */}
        <circle cx="35" cy="38" r="5" fill="#FF00FF" opacity="0.8" />
        <line x1="35" y1="38" x2="20" y2="51" stroke="#00FFFF" strokeWidth="2.5" opacity="0.9" />
        <line x1="35" y1="38" x2="35" y2="58" stroke="#00FFFF" strokeWidth="2.5" opacity="0.9" />

        {/* Right-top cube */}
        <circle cx="65" cy="38" r="5" fill="#FF00FF" opacity="0.8" />
        <line x1="65" y1="38" x2="80" y2="51" stroke="#00FFFF" strokeWidth="2.5" opacity="0.9" />
        <line x1="65" y1="38" x2="65" y2="58" stroke="#00FFFF" strokeWidth="2.5" opacity="0.9" />

        {/* Left cube */}
        <circle cx="20" cy="51" r="5" fill="#FF00FF" opacity="0.8" />
        <line x1="20" y1="51" x2="35" y2="58" stroke="#00FFFF" strokeWidth="2.5" opacity="0.9" />

        {/* Right cube */}
        <circle cx="80" cy="51" r="5" fill="#FF00FF" opacity="0.8" />
        <line x1="80" y1="51" x2="65" y2="58" stroke="#00FFFF" strokeWidth="2.5" opacity="0.9" />

        {/* Center cube */}
        <circle cx="50" cy="65" r="5" fill="#FF00FF" opacity="0.8" />
        <line x1="35" y1="58" x2="50" y2="65" stroke="#00FFFF" strokeWidth="2.5" opacity="0.9" />
        <line x1="65" y1="58" x2="50" y2="65" stroke="#00FFFF" strokeWidth="2.5" opacity="0.9" />

        {/* Bottom-left cube */}
        <circle cx="35" cy="80" r="5" fill="#FF00FF" opacity="0.8" />
        <line x1="35" y1="58" x2="35" y2="80" stroke="#00FFFF" strokeWidth="2.5" opacity="0.9" />
        <line x1="35" y1="80" x2="50" y2="65" stroke="#00FFFF" strokeWidth="2.5" opacity="0.9" />

        {/* Bottom-right cube */}
        <circle cx="65" cy="80" r="5" fill="#FF00FF" opacity="0.8" />
        <line x1="65" y1="58" x2="65" y2="80" stroke="#00FFFF" strokeWidth="2.5" opacity="0.9" />
        <line x1="65" y1="80" x2="50" y2="65" stroke="#00FFFF" strokeWidth="2.5" opacity="0.9" />
      </g>

      {/* Decorative elements */}
      <g opacity="0.6" filter="url(#glow)">
        <circle cx="15" cy="15" r="2.5" fill="#00FFFF" />
        <circle cx="85" cy="20" r="2.5" fill="#FF00FF" />
        <path d="M 20 75 L 25 70 L 30 75 L 25 80 Z" fill="#00FFFF" />
        <path d="M 75 10 L 80 5 L 85 10 L 80 15 Z" fill="#FF00FF" />
      </g>
    </svg>
  );
}