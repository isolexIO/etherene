import { questConceptName, renderQuestBadge } from '../../shared/badgeArt.ts';

export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const questKey = typeof body.quest === 'string' ? body.quest : 'etherene';
    const origin = 'https://etherene.info';
    const concept = questConceptName(questKey);

    const metadata = {
      name: `Etherene · ${concept}`,
      description:
        `An Etherene platform badge for the "${concept}" daily quest. ` +
        `Completion is recorded in the app; this badge is not an on-chain NFT.`,
      image: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderQuestBadge(questKey).svg)}`,
      external_url: origin,
      attributes: [
        { trait_type: 'Quest', value: questKey },
        { trait_type: 'Concept', value: concept },
        { trait_type: 'Network', value: 'Etherene platform' },
        { trait_type: 'Protocol', value: 'Etherene' },
        { trait_type: 'Standard', value: 'Platform quest badge' }
      ]
    };

    return Response.json(metadata, {
      headers: { 'Cache-Control': 'public, max-age=3600' }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}