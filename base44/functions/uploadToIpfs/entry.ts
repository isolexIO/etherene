import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { fileUrl, textContent, type } = await req.json();
        
        // Use Pinata for IPFS pinning
        // Requires PINATA_JWT to be set in secrets
        const pinataJwt = Deno.env.get("PINATA_JWT");
        
        if (!pinataJwt) {
            // Fallback for demo if no key set, return a mock CID if we can't upload
            // But better to error so user knows to set it
            return Response.json({ error: 'PINATA_JWT secret not set. Please add your Pinata JWT in Settings.' }, { status: 500 });
        }

        const formData = new FormData();

        if (type === 'file' && fileUrl) {
            // Fetch file from the temporary URL
            const fileRes = await fetch(fileUrl);
            if (!fileRes.ok) throw new Error("Failed to fetch source file");
            const blob = await fileRes.blob();
            formData.append('file', blob, 'avatar.png');
        } else if (type === 'json' && textContent) {
            // Upload Text/JSON
             const blob = new Blob([JSON.stringify({ content: textContent })], { type: 'application/json' });
             formData.append('file', blob, 'bio.json');
        } else {
             return Response.json({ error: 'Invalid input parameters' }, { status: 400 });
        }
        
        const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${pinataJwt}`
            },
            body: formData
        });

        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error?.details || data.message || "Failed to upload to IPFS");
        }

        return Response.json({ 
            cid: data.IpfsHash, 
            gateway_url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}` 
        });

    } catch (error) {
        console.error("IPFS Upload Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});