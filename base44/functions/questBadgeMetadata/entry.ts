import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export default async function(req) {
  try {
    const url = new URL(req.url);
    const questKey = url.searchParams.get('quest') || 'etherene';
    const origin = url.origin;

    const metadata = {
      name: 'Etherene Quest Badge',
      description:
        `A sovereign on-chain credential minted on the Etherene network. ` +
        `Awarded for completing the "${questKey}" daily quest through a verified, ` +
        `wallet-signed Solana transaction.`,
      image: `${origin}/functions/questBadgeImage?quest=${encodeURIComponent(questKey)}`,
      external_url: origin,
      attributes: [
        { trait_type: 'Quest', value: questKey },
        { trait_type: 'Network', value: 'Solana' },
        { trait_type: 'Protocol', value: 'Etherene' },
        { trait_type: 'Standard', value: 'Metaplex NFT' }
      ]
    };

    return Response.json(metadata, {
      headers: { 'Cache-Control': 'public, max-age=3600' }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}