import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { Connection, PublicKey } from 'npm:@solana/web3.js@^1.91.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        // Parse Body
        let body;
        try {
            body = await req.json();
        } catch (e) {
            return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }
        
        const { userAddress } = body;
        if (!userAddress) return Response.json({ error: "Address required" }, { status: 400 });

        const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
        const NAME_PROGRAM_ID = new PublicKey("namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX");
        let userKey;
        try {
            userKey = new PublicKey(userAddress);
        } catch(e) {
            return Response.json({ error: "Invalid address format" }, { status: 400 });
        }

        // Find all registries owned by user
        // The NameRegistryState struct starts with parent (32), owner (32), class (32).
        // Owner is at offset 32.
        const filters = [
            {
                memcmp: {
                    offset: 32,
                    bytes: userKey.toBase58()
                }
            },
            {
                dataSize: 2096 // We allocated 2000 + 96 header in our mint script
            }
        ];

        const accounts = await connection.getProgramAccounts(NAME_PROGRAM_ID, { filters });
        
        const stuck = [];
        for (const acc of accounts) {
            // Check if data is empty (after 96 bytes header)
            // If the data is all zeros, it means the update instruction failed to write the name
            const dataSlice = acc.account.data.slice(96);
            const isZero = dataSlice.every(b => b === 0);
            
            if (isZero) {
                stuck.push({
                    pubkey: acc.pubkey.toBase58(),
                    lamports: acc.account.lamports
                });
            }
        }

        return Response.json({ accounts: stuck });
    } catch (e) {
        console.error(e);
        return Response.json({ error: e.message }, { status: 500 });
    }
});