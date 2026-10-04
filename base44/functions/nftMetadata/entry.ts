import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { findPublicIdentity } from '../../shared/publicIdentity.ts';

export default async function(req) {
    try {
        const body = await req.json().catch(() => ({}));
        if (body.id == null && body.tokenId == null && !body.address) return Response.json({ error: 'Identity ID or wallet address required' }, { status: 400 });
        const base44 = createClientFromRequest(req);
        const identity = await findPublicIdentity(base44, body);
        if (!identity) return Response.json({ error: 'Identity not found' }, { status: 404 });
        return Response.json({
            name: identity.display_name || identity.subdomain,
            description: identity.bio || `Etherene identity: ${identity.subdomain}`,
            image: identity.avatar_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693568c43d156a928d236e54/9ccbd4280_logo.png',
            external_url: `https://etherene.info/Profile?address=${encodeURIComponent(identity.address)}`,
            attributes: [
                { trait_type: 'Network', value: identity.network || 'Solana Mainnet' },
                { trait_type: 'Status', value: identity.status },
                { trait_type: 'Subdomain', value: identity.subdomain },
                { trait_type: 'Wallet', value: identity.address }
            ]
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}