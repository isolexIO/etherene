import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
    try {
        const base44 = createClientFromRequest(req);

        const { fileUrl, textContent, type } = await req.json();

        // Require authentication — anonymous callers must not pin arbitrary
        // content to the app's paid Pinata account.
        try { await base44.auth.me(); } catch {
            return Response.json({ error: 'Authentication required to upload to IPFS.' }, { status: 401 });
        }

        // Use Pinata for IPFS pinning
        // Requires PINATA_JWT to be set in secrets
        const pinataJwt = process.env.PINATA_JWT;
        
        if (!pinataJwt) {
            // Fallback for demo if no key set, return a mock CID if we can't upload
            // But better to error so user knows to set it
            return Response.json({ error: 'PINATA_JWT secret not set. Please add your Pinata JWT in Settings.' }, { status: 500 });
        }

        const formData = new FormData();

        if (type === 'file' && fileUrl) {
            // Validate fileUrl to prevent SSRF
            const ALLOWED_HOSTS = ['images.unsplash.com', 'files.etherene.app', 'uploads.etherene.app'];
            let parsed;
            try {
                parsed = new URL(fileUrl);
            } catch (e) {
                return Response.json({ error: 'Invalid file URL' }, { status: 400 });
            }
            if (parsed.protocol !== 'https:') {
                return Response.json({ error: 'Only HTTPS URLs are allowed' }, { status: 400 });
            }
            const host = parsed.hostname.toLowerCase();
            const isAllowedDomain = ALLOWED_HOSTS.some(h => host === h || host.endsWith('.' + h));
            const isPrivate = host === 'localhost' || host === '0.0.0.0' ||
                host.startsWith('127.') || host.startsWith('10.') ||
                host.startsWith('192.168.') || host.startsWith('169.254.') ||
                /^172\.(1[6-9]|2\d|3[01])\./.test(host) || host.includes('::1') || host === '[::1]';
            if (!isAllowedDomain || isPrivate) {
                return Response.json({ error: 'File URL domain is not allowed' }, { status: 400 });
            }
            // Fetch file from the validated URL — reject redirects to prevent
            // allowlist bypass via 3xx from an allowed host.
            const fileRes = await fetch(parsed.href, { redirect: 'manual' });
            if (fileRes.status >= 300 && fileRes.status < 400) {
                return Response.json({ error: 'Redirects are not allowed for file uploads.' }, { status: 400 });
            }
            if (!fileRes.ok) throw new Error("Failed to fetch source file");
            const blob = await fileRes.blob();
            formData.append('file', blob, 'avatar.png');
        } else if (type === 'json' && textContent) {
           // Upload Text/JSON — cap size to prevent quota abuse.
           if (textContent.length > 10000) {
               return Response.json({ error: 'Content exceeds maximum allowed size.' }, { status: 400 });
           }
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
}