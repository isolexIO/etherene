import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const url = new URL(req.url);
        const tokenIdParam = url.searchParams.get("id") || url.searchParams.get("tokenId");
        
        if (!tokenIdParam) {
            return Response.json({ error: "Missing 'id' or 'tokenId' parameter" }, { status: 400 });
        }

        const tokenId = parseInt(tokenIdParam);
        const base44 = createClientFromRequest(req);
        
        // Use service role to read public data for metadata without needing user auth
        const identities = await base44.asServiceRole.entities.Identity.filter({ token_id: tokenId });
        const identity = identities[0];

        if (!identity) {
            return Response.json({ error: "Identity not found for this Token ID" }, { status: 404 });
        }

        // Construct the Metadata JSON (ERC-721 standard)
        // We assume the image generation function is available at /functions/nftImage
        const appUrl = url.origin; 
        const imageUrl = `${appUrl}/functions/nftImage?id=${tokenId}`;

        const metadata = {
            name: `Etherene Identity #${tokenId}`,
            description: `Sovereign Identity on the Etherene Network. Soul Hash: ${identity.soul_hash}`,
            image: imageUrl,
            external_url: `${appUrl}/Profile`,
            attributes: [
                {
                    trait_type: "Network",
                    value: identity.network === "137" ? "Polygon" : (identity.network === "8453" ? "Base" : "Unknown")
                },
                {
                    trait_type: "Status",
                    value: identity.status
                },
                {
                    trait_type: "Soul Hash",
                    value: identity.soul_hash
                }
            ]
        };

        return Response.json(metadata);

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});