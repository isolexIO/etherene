// Deterministic badge art generated from the quest key — no RPC, no DB.
import { seededRandom, createPolygon } from '../../shared/badgeArt.ts';

export default async function(req) {
  try {
    const url = new URL(req.url);
    const questKey = url.searchParams.get('quest') || 'etherene';
    const rng = seededRandom(questKey);

    const baseHue = 250 + Math.floor(rng() * 80) - 40;
    const primary = `hsl(${baseHue}, 80%, 62%)`;
    const accent = `hsl(${(baseHue + 120) % 360}, 90%, 65%)`;
    const glow = `hsla(${baseHue}, 100%, 72%, 0.7)`;

    const layers = 3 + Math.floor(rng() * 3);
    let layersSvg = "";
    for (let i = 0; i < layers; i++) {
      const points = rng() > 0.5 ? 6 : 8;
      const radius = 18 + i * 9;
      const stroke = rng() > 0.5 ? primary : accent;
      const sw = 0.6 + rng() * 1.4;
      const rot = rng() * 360;
      const filled = rng() > 0.85;
      const polyPoints = createPolygon(50, 50, radius, points, rot);
      layersSvg +=
        `<polygon points="${polyPoints}" fill="${filled ? stroke : 'none'}" ` +
        `fill-opacity="${filled ? 0.12 : 0}" stroke="${stroke}" stroke-width="${sw}" opacity="${0.4 + rng() * 0.5}" />`;
    }

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="g" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
      <stop offset="0%" stop-color="${glow}" stop-opacity="0.9" />
      <stop offset="100%" stop-color="${primary}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="100" height="100" rx="18" fill="#0b0b1a" />
  <circle cx="50" cy="50" r="46" fill="url(#g)" opacity="0.45" />
  ${layersSvg}
  <circle cx="50" cy="50" r="4" fill="${accent}" />
  <path d="M50 4 L50 12 M50 88 L50 96 M4 50 L12 50 M88 50 L96 50" stroke="white" stroke-width="0.6" opacity="0.35" />
  <text x="50" y="92" text-anchor="middle" font-family="monospace" font-size="6" fill="white" opacity="0.7">${questKey}</text>
</svg>`;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch {
    return new Response('error', { status: 500 });
  }
}