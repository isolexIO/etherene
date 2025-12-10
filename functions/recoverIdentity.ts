import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { Connection, PublicKey } from 'npm:@solana/web3.js@^1.91.0';
import bs58 from 'npm:bs58@5.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { txHash, userAddress } = await req.json();

        if (!txHash) return Response.json({ error: 'Transaction hash required' }, { status: 400 });

        console.log(`Recovering identity for tx: ${txHash}`);
        
        const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
        
        // 1. Fetch Transaction
        const tx = await connection.getParsedTransaction(txHash, {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed'
        });

        if (!tx) {
            return Response.json({ error: 'Transaction not found or not confirmed yet' }, { status: 404 });
        }

        // 2. Analyze Logs/Instructions to find the name
        // We look for "System Program: Create Account With Seed" OR Name Service Create
        // The seed is the name (e.g. "node-xyz").
        
        let foundSubdomain = null;

        // Strategy A: Check System Program CreateAccountWithSeed (Parsed)
        // parsed instruction structure: { program: 'system', parsed: { type: 'createAccountWithSeed', info: { seed: '...', ... } } }
        for (const ix of tx.transaction.message.instructions) {
            if (ix.program === 'system' && ix.parsed?.type === 'createAccountWithSeed') {
                if (ix.parsed.info?.seed) {
                    foundSubdomain = ix.parsed.info.seed;
                    console.log("Found subdomain in System instruction:", foundSubdomain);
                    break;
                }
            }
        }

        // Strategy B: Brute force check logs (sometimes logs contain the name if printed)
        // Strategy C: Check inner instructions
        if (!foundSubdomain && tx.meta?.innerInstructions) {
            for (const inner of tx.meta.innerInstructions) {
                for (const ix of inner.instructions) {
                    if (ix.program === 'system' && ix.parsed?.type === 'createAccountWithSeed') {
                        if (ix.parsed.info?.seed) {
                            foundSubdomain = ix.parsed.info.seed;
                            break;
                        }
                    }
                }
                if (foundSubdomain) break;
            }
        }

        // Strategy D: If we can't find the name but the TX was successful and involves Name Service
        // We might have to punt and ask the user, or use a placeholder.
        // BUT, if the minting used `createNameRegistry` from the SDK with a parent, it often uses `hashed_name` if passing to the program directly.
        // However, our `mintSolanaIdentity` code uses `createNameRegistry`.
        // If it used the default flow, it might have used a hashed name.
        
        // Fallback: If we can't find the text name, we verify the user owns a name account in the TX.
        // We can look at the account keys created.
        
        const NAME_PROGRAM_ID = "namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX";
        // Verify this TX actually interacted with Name Service
        const involvedNameService = tx.transaction.message.accountKeys.some(k => k.pubkey.toBase58 ? k.pubkey.toBase58() === NAME_PROGRAM_ID : k.pubkey === NAME_PROGRAM_ID);
        
        if (!involvedNameService && !foundSubdomain) {
             return Response.json({ error: 'Transaction does not appear to involve Name Service' }, { status: 400 });
        }

        if (!foundSubdomain) {
            // We failed to parse the name.
            // We'll return a special status so the frontend can ask the user for the name manually if they know it, 
            // OR we create a "Unknown Node" record.
            console.warn("Could not extract subdomain string from transaction.");
            
            // Try to extract from instruction data of Name Service (if it was passed as string)
            // It's a long shot but check raw data.
            // ...
            
            // For now, let's assume we can't find it if not in seed.
            return Response.json({ 
                success: false, 
                reason: 'unknown_name',
                details: 'Transaction verified but subdomain name could not be extracted.' 
            });
        }
        
        // 3. Create/Update DB Record
        const fullSubdomain = `${foundSubdomain}.etherene.sol`;
        const bio = `Solana Identity: ${fullSubdomain}`;
        
        // Check if exists
        const existing = await base44.asServiceRole.entities.Identity.filter({ address: userAddress });
        if (existing.length > 0) {
             return Response.json({ success: true, subdomain: fullSubdomain, message: 'Identity already exists' });
        }

        // Generate Avatar (Recalculate or use default)
        const prompt = `Abstract spiritual digital art, sacred geometry, node ${foundSubdomain}, ${bio}. Cyberpunk, 8k, blue purple.`;
        let imageUrl = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop";
        try {
             const imageRes = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
             imageUrl = imageRes.url;
        } catch(e) {}

        await base44.asServiceRole.entities.Identity.create({
             address: userAddress, 
             subdomain: fullSubdomain,
             network: 'Solana Mainnet',
             status: 'minted',
             bio: bio,
             avatar_url: imageUrl,
             cover_image: imageUrl
        });

        return Response.json({ success: true, subdomain: fullSubdomain, imageUrl });

    } catch (error) {
        console.error("Recovery failed:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});