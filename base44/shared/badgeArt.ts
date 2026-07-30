// Shared deterministic-art helpers used by on-chain badge / identity image
// generators. Plain module — no Deno.serve, no handler.

export const seededRandom = (seed) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h >>> 0) / 4294967296;
  };
};

export const createPolygon = (cx, cy, r, sides, rotation = 0) => {
  let points = "";
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI / sides) - (Math.PI / 2) + (rotation * Math.PI / 180);
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points += `${x.toFixed(2)},${y.toFixed(2)} `;
  }
  return points;
};

// XML-entity escape so no caller-supplied value can ever break out of the
// SVG markup (defense in depth — concept labels are from a static map, but
// this guarantees safety even if that ever changes).
const escapeXml = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

// ── Etherene concept registry ───────────────────────────────────────────────
// Each daily quest maps to a distinct visual concept + color theme + glyph so
// every badge is recognizably unique and rooted in the protocol's lore.

export const QUEST_CONCEPTS = {
  'sovereignty-keys':     { concept: 'Sovereignty', glyph: 'keys',     hue: 195, accentHue: 215 },
  'declare-identity':     { concept: 'Identity',    glyph: 'identity', hue: 295, accentHue: 325 },
  'transmit-insight':     { concept: 'Transmissions', glyph: 'radio', hue: 160, accentHue: 175 },
  'resonate-comment':     { concept: 'Resonance',   glyph: 'ripple',   hue: 340, accentHue: 355 },
  'ask-oracle':           { concept: 'The Oracle',  glyph: 'oracle',    hue: 35,  accentHue: 20 },
  'read-manifesto':       { concept: 'Manifesto',  glyph: 'scroll',    hue: 255, accentHue: 275 },
  'explore-blocks':       { concept: 'Transparency',glyph: 'compass',   hue: 195, accentHue: 185 },
  'daily-lesson':         { concept: 'Daily Practice', glyph: 'book',  hue: 275, accentHue: 295 },
  'study-principles':     { concept: 'Principles',  glyph: 'network',  hue: 230, accentHue: 250 },
  'enter-sanctum':        { concept: 'The Sanctum', glyph: 'flame',     hue: 20,  accentHue: 0 },
  'consensus-mechanics':  { concept: 'Consensus',   glyph: 'chip',     hue: 170, accentHue: 150 },
  'amplify-signal':       { concept: 'Amplification', glyph: 'bolt',   hue: 45,  accentHue: 35 },
  'genesis-block':        { concept: 'The Genesis', glyph: 'genesis',   hue: 220, accentHue: 200 },
  'follow-node':          { concept: 'Connection',  glyph: 'link',      hue: 345, accentHue: 330 },
};

const DEFAULT_CONCEPT = { concept: 'Etherene', glyph: 'sigil', hue: 265, accentHue: 295 };

const glyphColors = (hue, accentHue) => ({
  primary: `hsl(${hue}, 80%, 62%)`,
  accent: `hsl(${accentHue}, 90%, 66%)`,
  glow: `hsla(${hue}, 100%, 72%, 0.75)`,
  bg: `hsl(${(hue + 210) % 360}, 45%, 7%)`,
});

// ── Glyphs (drawn in a 100×100 viewBox, centered ~50,50) ─────────────────────
const GLYPHS = {
  // Sovereignty — a key ring + stemmed bit
  keys: (c) => `
    <circle cx="40" cy="38" r="12" fill="none" stroke="${c.primary}" stroke-width="3.2"/>
    <circle cx="40" cy="38" r="4.5" fill="${c.accent}"/>
    <path d="M40 50 L40 70 L48 70 L48 64 M48 70 L56 70 L56 64" fill="none" stroke="${c.primary}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M40 50 L40 74" stroke="${c.accent}" stroke-width="3.4" stroke-linecap="round"/>`,

  // Identity — a hexagonal node badge with an orbiting name dot
  identity: (c) => {
    const hex = createPolygon(50, 50, 24, 6, 0);
    return `
      <polygon points="${hex}" fill="none" stroke="${c.primary}" stroke-width="2.8"/>
      <polygon points="${createPolygon(50, 50, 16, 6, 0)}" fill="${c.primary}" fill-opacity="0.12" stroke="${c.accent}" stroke-width="1.6"/>
      <circle cx="50" cy="50" r="5.5" fill="${c.accent}"/>
      <circle cx="50" cy="50" r="24" fill="none" stroke="${c.accent}" stroke-width="0.8" stroke-dasharray="2 3" opacity="0.7"/>
      <circle cx="74" cy="50" r="2.6" fill="${c.accent}"/>`;
  },

  // Transmissions — antenna + broadcast arcs
  radio: (c) => `
    <path d="M50 78 L50 52" stroke="${c.primary}" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="50" cy="48" r="4" fill="${c.accent}"/>
    <path d="M36 44 A18 18 0 0 1 64 44" fill="none" stroke="${c.primary}" stroke-width="2.4" stroke-linecap="round" opacity="0.95"/>
    <path d="M30 42 A26 26 0 0 1 70 42" fill="none" stroke="${c.accent}" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
    <path d="M24 40 A34 34 0 0 1 76 40" fill="none" stroke="${c.primary}" stroke-width="1.6" stroke-linecap="round" opacity="0.35"/>`,

  // Resonance — concentric ripples from a center signal
  ripple: (c) => `
    <circle cx="50" cy="50" r="5" fill="${c.accent}"/>
    <circle cx="50" cy="50" r="14" fill="none" stroke="${c.primary}" stroke-width="2.6" opacity="0.9"/>
    <circle cx="50" cy="50" r="24" fill="none" stroke="${c.primary}" stroke-width="2" opacity="0.55"/>
    <circle cx="50" cy="50" r="33" fill="none" stroke="${c.accent}" stroke-width="1.5" opacity="0.3"/>`,

  // The Oracle — all-seeing eye with radiance
  oracle: (c) => `
    <path d="M26 50 Q50 32 74 50 Q50 68 26 50 Z" fill="none" stroke="${c.primary}" stroke-width="2.8"/>
    <circle cx="50" cy="50" r="8" fill="${c.accent}"/>
    <circle cx="50" cy="50" r="3" fill="${c.bg}"/>
    <g stroke="${c.accent}" stroke-width="1.8" stroke-linecap="round" opacity="0.8">
      <path d="M50 30 L50 24"/><path d="M33 36 L29 31"/><path d="M67 36 L71 31"/>
    </g>`,

  // Manifesto — a rolled scroll
  scroll: (c) => `
    <rect x="34" y="36" width="32" height="28" rx="3" fill="${c.primary}" fill-opacity="0.1" stroke="${c.primary}" stroke-width="2.6"/>
    <path d="M34 36 a5 5 0 0 0 -5 5 v18 a5 5 0 0 0 5 5" fill="none" stroke="${c.accent}" stroke-width="2.6"/>
    <path d="M66 36 a5 5 0 0 1 5 5 v18 a5 5 0 0 1 -5 5" fill="none" stroke="${c.accent}" stroke-width="2.6"/>
    <g stroke="${c.primary}" stroke-width="1.6" opacity="0.85">
      <path d="M40 44 H60"/><path d="M40 50 H60"/><path d="M40 56 H54"/>
    </g>`,

  // Transparency / Explorer — compass rose
  compass: (c) => {
    const rose = `${createPolygon(50, 50, 26, 4, 0)} ${createPolygon(50, 50, 12, 4, 45)}`;
    return `
      <circle cx="50" cy="50" r="27" fill="none" stroke="${c.primary}" stroke-width="2.4"/>
      <polygon points="${createPolygon(50, 50, 26, 4, 0)}" fill="${c.primary}" fill-opacity="0.18" stroke="${c.primary}" stroke-width="2"/>
      <polygon points="${createPolygon(50, 50, 11, 4, 45)}" fill="${c.accent}" fill-opacity="0.4"/>
      <circle cx="50" cy="50" r="3.4" fill="${c.accent}"/>
      <path d="M50 20 L50 14 M50 86 L50 80 M20 50 L14 50 M86 50 L80 50" stroke="${c.accent}" stroke-width="1.4" opacity="0.7"/>`;
  },

  // Daily Practice — an open book
  book: (c) => `
    <path d="M50 38 C44 33 34 32 28 33 V62 C34 61 44 62 50 67 Z" fill="${c.primary}" fill-opacity="0.12" stroke="${c.primary}" stroke-width="2.6"/>
    <path d="M50 38 C56 33 66 32 72 33 V62 C66 61 56 62 50 67 Z" fill="${c.primary}" fill-opacity="0.12" stroke="${c.primary}" stroke-width="2.6"/>
    <path d="M50 38 L50 67" stroke="${c.accent}" stroke-width="2.6"/>
    <g stroke="${c.accent}" stroke-width="1.3" opacity="0.8">
      <path d="M33 40 H44"/><path d="M33 45 H44"/><path d="M56 40 H67"/><path d="M56 45 H67"/>
    </g>`,

  // Principles — connected nodes network
  network: (c, rng) => {
    const nodes = [[50, 34], [72, 46], [64, 70], [36, 70], [28, 46]];
    let g = `<circle cx="50" cy="52" r="4.5" fill="${c.accent}"/>`;
    nodes.forEach(([x, y]) => {
      g += `<path d="M50 52 L${x} ${y}" stroke="${c.primary}" stroke-width="1.8" opacity="0.7"/>`;
      g += `<circle cx="${x}" cy="${y}" r="4.2" fill="${c.primary}"/>`;
    });
    return g;
  },

  // The Sanctum — a flame
  flame: (c) => `
    <path d="M50 26 C40 40 38 48 44 58 C40 54 46 64 50 66 C54 64 60 54 56 58 C62 48 60 40 50 26 Z" fill="${c.primary}" fill-opacity="0.25" stroke="${c.primary}" stroke-width="2.4"/>
    <path d="M50 40 C45 48 46 54 50 58 C54 54 55 48 50 40 Z" fill="${c.accent}"/>`,

  // Consensus — a CPU chip
  chip: (c) => `
    <rect x="36" y="36" width="28" height="28" rx="3" fill="${c.primary}" fill-opacity="0.12" stroke="${c.primary}" stroke-width="2.8"/>
    <rect x="44" y="44" width="12" height="12" rx="1.5" fill="${c.accent}"/>
    <g stroke="${c.accent}" stroke-width="2" stroke-linecap="round">
      <path d="M42 36 V30 M50 36 V30 M58 36 V30 M42 64 V70 M50 64 V70 M58 64 V70 M36 42 H30 M36 50 H30 M36 58 H30 M64 42 H70 M64 50 H70 M64 58 H70"/>
    </g>`,

  // Amplification — lightning bolt + signal bars
  bolt: (c) => `
    <path d="M52 24 L40 50 L49 50 L44 72 L60 44 L51 44 Z" fill="${c.primary}" stroke="${c.primary}" stroke-width="1.6" stroke-linejoin="round"/>
    <g fill="${c.accent}">
      <rect x="30" y="56" width="4" height="10" rx="1"/>
      <rect x="30" y="48" width="4" height="6" rx="1" opacity="0.7"/>
    </g>`,

  // The Genesis — block zero rising over a horizon
  genesis: (c) => `
    <path d="M16 66 H84" stroke="${c.primary}" stroke-width="2.4" opacity="0.7"/>
    <g transform="translate(50 48)">
      <path d="M-12 6 L0 -8 L12 6 Z M-12 6 L0 20 L12 6 Z M0 -8 L0 20 M-12 6 L12 6" fill="${c.primary}" fill-opacity="0.12" stroke="${c.primary}" stroke-width="2.4"/>
    </g>
    <circle cx="50" cy="40" r="2.8" fill="${c.accent}"/>
    <text x="50" y="80" text-anchor="middle" font-family="monospace" font-size="7" fill="${c.accent}" font-weight="700">0</text>`,

  // Connection — interlocking links
  link: (c) => `
    <path d="M44 50 H58" stroke="${c.primary}" stroke-width="3.2" stroke-linecap="round"/>
    <circle cx="38" cy="50" r="11" fill="none" stroke="${c.primary}" stroke-width="3"/>
    <circle cx="62" cy="50" r="11" fill="none" stroke="${c.accent}" stroke-width="3"/>
    <circle cx="50" cy="50" r="3.2" fill="${c.accent}"/>`,

  // Default sigil — nested Etherene hex
  sigil: (c) => `
    <polygon points="${createPolygon(50, 50, 26, 6, 0)}" fill="none" stroke="${c.primary}" stroke-width="2.6"/>
    <polygon points="${createPolygon(50, 50, 17, 6, 30)}" fill="none" stroke="${c.accent}" stroke-width="2"/>
    <circle cx="50" cy="50" r="5" fill="${c.accent}"/>`,
};

// ── Full badge renderer ─────────────────────────────────────────────────────
export const renderQuestBadge = (questKey) => {
  const meta = QUEST_CONCEPTS[questKey] || DEFAULT_CONCEPT;
  const c = glyphColors(meta.hue, meta.accentHue);
  const rng = seededRandom(questKey + '|badge');

  // Deterministic cosmic starfield
  let stars = "";
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(rng() * 100);
    const y = Math.floor(rng() * 100);
    const r = (rng() * 0.7 + 0.2).toFixed(2);
    const o = (0.15 + rng() * 0.5).toFixed(2);
    stars += `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${o}"/>`;
  }

  const glyph = (GLYPHS[meta.glyph] || GLYPHS.sigil)(c, rng);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="halo" cx="50%" cy="46%" r="55%">
      <stop offset="0%" stop-color="${c.glow}" stop-opacity="0.95"/>
      <stop offset="70%" stop-color="${c.primary}" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="${c.primary}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c.primary}"/>
      <stop offset="100%" stop-color="${c.accent}"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="20" fill="${c.bg}"/>
  ${stars}
  <circle cx="50" cy="46" r="44" fill="url(#halo)"/>
  <circle cx="50" cy="50" r="40" fill="none" stroke="url(#ring)" stroke-width="1.4" opacity="0.5"/>
  ${glyph}
  <text x="50" y="14" text-anchor="middle" font-family="monospace" font-size="4.5" fill="${c.primary}" opacity="0.8" letter-spacing="1">ETHERENE</text>
  <text x="50" y="93" text-anchor="middle" font-family="monospace" font-size="6.5" fill="white" opacity="0.92" font-weight="700" letter-spacing="1.5">${escapeXml(meta.concept.toUpperCase())}</text>
</svg>`;

  return { svg, concept: meta.concept };
};

export const questConceptName = (questKey) =>
  (QUEST_CONCEPTS[questKey] || DEFAULT_CONCEPT).concept;