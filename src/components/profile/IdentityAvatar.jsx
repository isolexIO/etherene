import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Pseudo-random number generator
const seededRandom = (seed) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h >>> 0) / 4294967296;
  }
};

export default function IdentityAvatar({ address, subdomain, size = 200 }) {
  const seed = (address || '') + (subdomain || '');
  
  const { layers, colors, glowColor, coreType } = useMemo(() => {
    const rng = seededRandom(seed);
    
    // Solana Theme (Green/Purple/Blue)
    const baseHue = 270; // Purple base for Solana/Etherene
    const primaryColor = `hsl(${baseHue}, 80%, 60%)`;
    const secondaryColor = `hsl(150, 90%, 45%)`; // Solana Green
    const accentColor = `hsl(190, 90%, 60%)`; // Cyan
    const glowColor = `hsla(${baseHue}, 100%, 70%, 0.6)`;
    
    const palette = [primaryColor, secondaryColor, accentColor, '#ffffff'];

    // Generate Layers for the Mandala
    const numLayers = 3 + Math.floor(rng() * 3);
    const layers = [];
    
    for (let i = 0; i < numLayers; i++) {
        const shapeType = rng() > 0.5 ? 'hexagon' : 'circle';
        const pointCount = shapeType === 'hexagon' ? 6 : (8 + Math.floor(rng() * 8));
        const radius = 30 + (i * 15);
        const rotationSpeed = (rng() - 0.5) * 20; // Animation prop
        
        layers.push({
            type: shapeType,
            points: pointCount,
            radius: radius,
            stroke: palette[Math.floor(rng() * palette.length)],
            strokeWidth: 0.5 + rng() * 1.5,
            rotation: rng() * 360,
            rotationSpeed,
            opacity: 0.4 + rng() * 0.6,
            filled: rng() > 0.8
        });
    }

    const coreType = rng() > 0.5 ? 'crystal' : 'star';

    return { layers, colors: palette, glowColor, coreType };
    }, [seed]);

  // Helper to create polygon points
  const createPolygon = (r, sides, rotation = 0) => {
    let points = "";
    for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI / sides) - (Math.PI / 2) + (rotation * Math.PI / 180);
        const x = 50 + r * Math.cos(angle);
        const y = 50 + r * Math.sin(angle);
        points += `${x},${y} `;
    }
    return points;
  };

  return (
    <div className="relative group overflow-hidden rounded-full shadow-2xl bg-slate-950 border-4 border-slate-900" style={{ width: size, height: size }}>
      
      {/* Dynamic Sacred Geometry SVG */}
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <radialGradient id="soulGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor={glowColor} stopOpacity="0.8" />
                <stop offset="100%" stopColor={colors[0]} stopOpacity="0" />
            </radialGradient>
            <filter id="bloom">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        
        {/* Background Glow */}
        <circle cx="50" cy="50" r="45" fill="url(#soulGlow)" opacity="0.4" />

        {/* Core Identity */}
        <motion.circle 
            cx="50" cy="50" r="5" 
            fill={colors[2]} 
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            filter="url(#bloom)"
        />

        {/* Layers */}
        {layers.map((layer, i) => (
            <motion.g 
                key={i}
                initial={{ opacity: 0, rotate: layer.rotation }}
                animate={{ opacity: layer.opacity, rotate: layer.rotation + 360 }}
                transition={{ duration: 20 + Math.abs(100/layer.rotationSpeed), repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "50px 50px" }}
            >
                {layer.type === 'hexagon' || layer.type === 'circle' ? ( // Actually reusing polygon logic for both sort of
                    <polygon 
                        points={createPolygon(layer.radius, layer.type === 'hexagon' ? 6 : layer.points)}
                        fill={layer.filled ? layer.stroke : 'none'}
                        fillOpacity={layer.filled ? 0.1 : 0}
                        stroke={layer.stroke}
                        strokeWidth={layer.strokeWidth}
                        filter="url(#bloom)"
                    />
                ) : null}
                
                {/* Connecting Lines for decorative purpose if complex */}
                {!layer.filled && (
                    <circle cx="50" cy="50" r={layer.radius * 0.8} stroke={layer.stroke} strokeWidth="0.2" opacity="0.5" strokeDasharray="2 2" />
                )}
            </motion.g>
        ))}

        {/* Overlay Tech Lines */}
        <path d="M50 0 L50 10 M50 90 L50 100 M0 50 L10 50 M90 50 L100 50" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <circle cx="50" cy="50" r="48" stroke="white" strokeWidth="0.5" opacity="0.2" strokeDasharray="10 5" />
      </svg>
    </div>
  );
}