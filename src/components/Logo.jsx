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
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* 4D Cube Structure - 8 vertices */}
      <g filter="url(#glow)">
        {/* Front face cube - bright cyan */}
        
        {/* Front bottom-left */}
        <circle cx="25" cy="65" r="4.5" fill="#00FFFF" />
        {/* Front bottom-right */}
        <circle cx="75" cy="65" r="4.5" fill="#00FFFF" />
        {/* Front top-right */}
        <circle cx="75" cy="35" r="4.5" fill="#00FFFF" />
        {/* Front top-left */}
        <circle cx="25" cy="35" r="4.5" fill="#00FFFF" />

        {/* Back face cube - magenta */}
        
        {/* Back bottom-left */}
        <circle cx="35" cy="75" r="4.5" fill="#FF00FF" />
        {/* Back bottom-right */}
        <circle cx="85" cy="75" r="4.5" fill="#FF00FF" />
        {/* Back top-right */}
        <circle cx="85" cy="45" r="4.5" fill="#FF00FF" />
        {/* Back top-left */}
        <circle cx="35" cy="45" r="4.5" fill="#FF00FF" />

        {/* Front face edges - cyan */}
        <line x1="25" y1="65" x2="75" y2="65" stroke="#00FFFF" strokeWidth="2" opacity="0.9" />
        <line x1="75" y1="65" x2="75" y2="35" stroke="#00FFFF" strokeWidth="2" opacity="0.9" />
        <line x1="75" y1="35" x2="25" y2="35" stroke="#00FFFF" strokeWidth="2" opacity="0.9" />
        <line x1="25" y1="35" x2="25" y2="65" stroke="#00FFFF" strokeWidth="2" opacity="0.9" />

        {/* Back face edges - magenta */}
        <line x1="35" y1="75" x2="85" y2="75" stroke="#FF00FF" strokeWidth="2" opacity="0.9" />
        <line x1="85" y1="75" x2="85" y2="45" stroke="#FF00FF" strokeWidth="2" opacity="0.9" />
        <line x1="85" y1="45" x2="35" y2="45" stroke="#FF00FF" strokeWidth="2" opacity="0.9" />
        <line x1="35" y1="45" x2="35" y2="75" stroke="#FF00FF" strokeWidth="2" opacity="0.9" />

        {/* Depth connecting edges - gradient cyan to magenta */}
        <line x1="25" y1="65" x2="35" y2="75" stroke="#00CCFF" strokeWidth="2" opacity="0.85" />
        <line x1="75" y1="65" x2="85" y2="75" stroke="#CC00FF" strokeWidth="2" opacity="0.85" />
        <line x1="75" y1="35" x2="85" y2="45" stroke="#CC00FF" strokeWidth="2" opacity="0.85" />
        <line x1="25" y1="35" x2="35" y2="45" stroke="#00CCFF" strokeWidth="2" opacity="0.85" />

        {/* Center point - extra dimensional */}
        <circle cx="50" cy="50" r="3.5" fill="#00FFFF" opacity="0.7" />
        
        {/* Lines to center from all vertices - 4D perspective */}
        <line x1="25" y1="65" x2="50" y2="50" stroke="#FF00FF" strokeWidth="1.5" opacity="0.5" />
        <line x1="75" y1="65" x2="50" y2="50" stroke="#00FFFF" strokeWidth="1.5" opacity="0.5" />
        <line x1="75" y1="35" x2="50" y2="50" stroke="#FF00FF" strokeWidth="1.5" opacity="0.5" />
        <line x1="25" y1="35" x2="50" y2="50" stroke="#00FFFF" strokeWidth="1.5" opacity="0.5" />
      </g>
    </svg>
  );
}