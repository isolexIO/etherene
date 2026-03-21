import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { Buffer } from "node:buffer";

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

import { Connection, PublicKey } from 'npm:@solana/web3.js@^1.91.0';
import { getDomainKey, NameRegistryState } from 'npm:@bonfida/spl-name-service@^2.3.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { domain, userAddress } = body;

        if (!domain || !userAddress) {
            return Response.json({ error: 'Domain and user address required' }, { status: 400 });
        }

        const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
        const userPubkey = new PublicKey(userAddress);

        // Parse domain (handle .sol TLD)
        let domainName = domain.trim().toLowerCase();
        if (domainName.endsWith('.sol')) {
            domainName = domainName.slice(0, -4);
        }

        // Check if it's a subdomain
        const parts = domainName.split('.');
        let domainKey;

        if (parts.length === 1) {
            // Top-level domain (e.g., "yourname")
            const SOL_TLD = new PublicKey("58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9ZP11");
            const result = await getDomainKey(domainName, SOL_TLD);
            domainKey = result.pubkey;
        } else {
            // Subdomain (e.g., "sub.parent")
            const parentName = parts.slice(1).join('.');
            const subName = parts[0];
            
            // Get parent key first
            const SOL_TLD = new PublicKey("58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9ZP11");
            const parentResult = await getDomainKey(parentName, SOL_TLD);
            const parentKey = parentResult.pubkey;
            
            // Get subdomain key
            const subResult = await getDomainKey(subName, parentKey);
            domainKey = subResult.pubkey;
        }

        // Check if domain exists and get owner
        const accountInfo = await connection.getAccountInfo(domainKey);
        if (!accountInfo) {
            return Response.json({ 
                success: false, 
                error: 'Domain not found on Solana Name Service' 
            }, { status: 404 });
        }

        // Parse registry to get owner
        const { registry } = await NameRegistryState.retrieve(connection, domainKey);
        const owner = registry.owner.toBase58();

        // Verify ownership
        if (owner !== userAddress) {
            return Response.json({
                success: false,
                error: `Domain is owned by ${owner.slice(0, 8)}... but you are ${userAddress.slice(0, 8)}...`
            }, { status: 403 });
        }

        // Success - user owns this domain
        return Response.json({
            success: true,
            subdomain: `${domainName}.sol`,
            owner: owner,
            registryAddress: domainKey.toBase58()
        });

    } catch (error) {
        console.error("Verification error:", error);
        return Response.json({ 
            success: false,
            error: error.message || 'Verification failed' 
        }, { status: 500 });
    }
});