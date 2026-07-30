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