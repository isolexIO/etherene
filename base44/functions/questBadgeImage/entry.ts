// Deterministic badge art generated from the quest key — each quest renders a
// unique Etherene-concept glyph (sovereignty key, transmission arcs, sanctum
// flame, etc.) with its own color theme. No RPC, no DB.
import { renderQuestBadge } from '../../shared/badgeArt.ts';

export default async function(req) {
  try {
    const url = new URL(req.url);
    const questKey = url.searchParams.get('quest') || 'etherene';
    const { svg } = renderQuestBadge(questKey);

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