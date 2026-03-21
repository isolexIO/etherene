import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { Connection, PublicKey } from 'npm:@solana/web3.js@^1.91.0';
import { getDomainKey } from 'npm:@bonfida/spl-name-service@^2.3.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { userAddress } = await req.json();

        if (!userAddress) return Response.json({ error: 'User address required' }, { status: 400 });

        const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
        const SOL_TLD = new PublicKey("58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9ZP11");
        const { pubkey: parentNameKey } = await getDomainKey("etherene", SOL_TLD);
        const NAME_PROGRAM_ID = new PublicKey("namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX");

        // Find accounts owned by user with parent = etherene
        // Layout: parent (32), owner (32), class (32)
        const filters = [
            { memcmp: { offset: 0, bytes: parentNameKey.toBase58() } },
            { memcmp: { offset: 32, bytes: userAddress } }
        ];

        const accounts = await connection.getProgramAccounts(NAME_PROGRAM_ID, { filters });

        if (accounts.length > 0) {
            // Found one!
            const acc = accounts[0];
            // Decode data to see if we stored the name
            // Header is 96 bytes. Data starts after.
            const dataBuffer = acc.account.data.slice(96);
            
            let name = null;
            // Remove null bytes and trim
            try {
                const text = new TextDecoder().decode(dataBuffer).replace(/\0/g, '');
                if (text && text.length > 2) {
                    name = text;
                }
            } catch (e) {}

            return Response.json({ 
                found: true, 
                registryAddress: acc.pubkey.toBase58(),
                subdomain: name ? `${name}.etherene.sol` : null
            });
        }

        return Response.json({ found: false });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});