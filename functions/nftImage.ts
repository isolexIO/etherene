import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Helper for pseudo-random numbers
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

const createPolygon = (cx, cy, r, sides, rotation = 0) => {
    let points = "";
    for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI / sides) - (Math.PI / 2) + (rotation * Math.PI / 180);
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        points += `${x.toFixed(2)},${y.toFixed(2)} `;
    }
    return points;
};

Deno.serve(async (req) => {
    try {
        const url = new URL(req.url);
        const tokenIdParam = url.searchParams.get("id");
        
        if (!tokenIdParam) {
            return new Response("Missing id", { status: 400 });
        }

        const tokenId = parseInt(tokenIdParam);
        const base44 = createClientFromRequest(req);
        
        const identities = await base44.asServiceRole.entities.Identity.filter({ token_id: tokenId });
        const identity = identities[0];

        if (!identity) {
             // Return a generic placeholder if not found
             return new Response(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#ccc"/><text x="50" y="50" text-anchor="middle">?</text></svg>`, {
                headers: { "Content-Type": "image/svg+xml" }
            });
        }

        // Generate SVG based on identity data
        const seed = (identity.address || '') + (identity.soul_hash || '');
        const chainId = parseInt(identity.network);
        const rng = seededRandom(seed);

        const baseHue = chainId === 137 ? 270 : (chainId === 8453 ? 210 : 240);
        const primaryColor = `hsl(${baseHue}, 80%, 60%)`;
        const glowColor = `hsla(${baseHue}, 100%, 70%, 0.6)`;
        const colors = [
            primaryColor,
            `hsl(${(baseHue + 180) % 360}, 70%, 50%)`,
            `hsl(${(baseHue + 60) % 360}, 90%, 70%)`
        ];

        const numLayers = 3 + Math.floor(rng() * 3);
        let layersSvg = "";
        
        for (let i = 0; i < numLayers; i++) {
            const shapeType = rng() > 0.5 ? 'hexagon' : 'circle';
            const points = shapeType === 'hexagon' ? 6 : (8 + Math.floor(rng() * 8));
            const radius = 30 + (i * 15);
            const stroke = colors[Math.floor(rng() * colors.length)];
            const strokeWidth = 0.5 + rng() * 1.5;
            const rotation = rng() * 360;
            const filled = rng() > 0.8;
            const opacity = 0.4 + rng() * 0.6;

            if (shapeType === 'hexagon' || shapeType === 'circle') {
                const polyPoints = createPolygon(50, 50, radius, points, rotation);
                layersSvg += `<polygon points="${polyPoints}" fill="${filled ? stroke : 'none'}" fill-opacity="${filled ? 0.1 : 0}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
            }
        }

        const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
        <radialGradient id="soulGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stop-color="${glowColor}" stop-opacity="0.8" />
            <stop offset="100%" stop-color="${colors[0]}" stop-opacity="0" />
        </radialGradient>
    </defs>
    <rect width="100" height="100" fill="#020617" />
    <circle cx="50" cy="50" r="45" fill="url(#soulGlow)" opacity="0.4" />
    <circle cx="50" cy="50" r="5" fill="${colors[2]}" />
    ${layersSvg}
    <path d="M50 0 L50 10 M50 90 L50 100 M0 50 L10 50 M90 50 L100 50" stroke="white" stroke-width="0.5" opacity="0.3" />
</svg>`;

        return new Response(svg, {
            headers: {
                "Content-Type": "image/svg+xml",
                "Cache-Control": "public, max-age=3600"
            }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});