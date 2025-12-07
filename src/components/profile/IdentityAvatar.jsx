import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Simple pseudo-random number generator seeded by string
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

export default function IdentityAvatar({ address, soulHash, size = 200, chainId }) {
  const seed = (address || '') + (soulHash || '');
  
  const { colors, shapes, traits } = useMemo(() => {
    const rng = seededRandom(seed);
    const chainColor = chainId === 137 ? '#8b5cf6' : (chainId === 8453 ? '#2563eb' : '#4f46e5');
    
    // Generate color palette based on address/hash
    const hue = Math.floor(rng() * 360);
    const secondaryHue = (hue + 180) % 360;
    
    const palette = [
      chainColor,
      `hsl(${hue}, 70%, 60%)`,
      `hsl(${secondaryHue}, 60%, 50%)`,
      `hsl(${(hue + 60) % 360}, 80%, 70%)`
    ];

    // Generate shapes
    const numShapes = 5 + Math.floor(rng() * 5);
    const generatedShapes = Array.from({ length: numShapes }).map((_, i) => ({
      type: rng() > 0.5 ? 'circle' : 'rect',
      x: rng() * 100,
      y: rng() * 100,
      size: 10 + rng() * 40,
      rotation: rng() * 360,
      color: palette[Math.floor(rng() * palette.length)],
      opacity: 0.3 + rng() * 0.5
    }));

    // Derived "History" Traits
    const traits = [
      { label: 'Origin', value: 'Block ' + Math.floor(rng() * 15000000) },
      { label: 'Resonance', value: (rng() * 100).toFixed(2) + '%' },
      { label: 'Archetype', value: ['Guardian', 'Seeker', 'Validator', 'Architect'][Math.floor(rng() * 4)] }
    ];

    return { colors: palette, shapes: generatedShapes, traits };
  }, [seed, chainId]);

  return (
    <div className="relative group" style={{ width: size, height: size }}>
      {/* Avatar SVG */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full h-full rounded-2xl overflow-hidden bg-slate-900 relative shadow-inner border-4 border-white/10"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <rect width="100" height="100" fill={colors[0]} opacity="0.1" />
            
            {shapes.map((shape, i) => (
                <motion.g 
                    key={i}
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ scale: 1, rotate: shape.rotation }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    style={{ transformOrigin: `${shape.x}% ${shape.y}%` }}
                >
                    {shape.type === 'circle' ? (
                        <circle 
                            cx={shape.x} 
                            cy={shape.y} 
                            r={shape.size / 2} 
                            fill={shape.color} 
                            fillOpacity={shape.opacity}
                            filter="url(#glow)"
                        />
                    ) : (
                        <rect 
                            x={shape.x - shape.size/2} 
                            y={shape.y - shape.size/2} 
                            width={shape.size} 
                            height={shape.size} 
                            fill={shape.color} 
                            fillOpacity={shape.opacity}
                            filter="url(#glow)"
                        />
                    )}
                </motion.g>
            ))}
            
            {/* Overlay Grid */}
            <path d="M0 0 L100 100 M100 0 L0 100" stroke="white" strokeOpacity="0.1" strokeWidth="0.5" />
        </svg>
        
        {/* Chain Badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-[10px] text-white font-mono border border-white/20">
            {chainId === 137 ? 'POLYGON' : (chainId === 8453 ? 'BASE' : 'ETH')}
        </div>
      </motion.div>

      {/* Traits Tooltip */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-48 bg-white/90 backdrop-blur-md rounded-xl p-3 shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        <h4 className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider">Soul Traits</h4>
        <div className="space-y-1">
            {traits.map((trait, i) => (
                <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-500">{trait.label}</span>
                    <span className="font-mono text-indigo-600">{trait.value}</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}