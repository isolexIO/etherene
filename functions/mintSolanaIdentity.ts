import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { Buffer } from "node:buffer";

// Polyfill Buffer for Solana web3.js
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram
} from 'npm:@solana/web3.js@^1.91.0';
import { 
  getDomainKey, 
  createNameRegistry,
  Numberu64
} from 'npm:@bonfida/spl-name-service@^2.3.1';
import bs58 from 'npm:bs58@5.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Parse Body
        const body = await req.json();
        let { userAddress } = body;
        console.log("Mint request payload:", JSON.stringify(body));

        // Strict Validation
        if (!userAddress || typeof userAddress !== 'string') {
            return Response.json({ error: 'Solana user address required' }, { status: 400 });
        }

        userAddress = userAddress.trim();
        let userPublicKey;
        try {
            userPublicKey = new PublicKey(userAddress);
        } catch (e) {
            return Response.json({ error: `Invalid public key: ${userAddress}` }, { status: 400 });
        }

        // 1. Load Server Key (Parent Domain Owner & Fee Receiver)
        const privateKeyString = Deno.env.get("SOLANA_PAYER_PRIVATE_KEY");
        if (!privateKeyString) {
            return Response.json({ error: 'Server Missing Payer Key' }, { status: 500 });
        }
        
        let serverKeypair;
        try {
            const secretKey = privateKeyString.trim().startsWith('[') 
                ? Uint8Array.from(JSON.parse(privateKeyString))
                : bs58.decode(privateKeyString.trim());
            serverKeypair = Keypair.fromSecretKey(secretKey);
        } catch (e) {
            console.error("Key parse failed", e);
            return Response.json({ error: 'Server Configuration Error' }, { status: 500 });
        }

        // 2. Fetch User Context for AI
        const ethAddress = userAddress; 
        let identities = [], transmissions = [], settingsList = [];
        try {
            [identities, transmissions, settingsList] = await Promise.all([
                 base44.asServiceRole.entities.Identity.filter({ address: ethAddress }),
                 base44.asServiceRole.entities.Transmission.filter({ author_address: ethAddress }),
                 base44.asServiceRole.entities.GlobalSettings.list()
            ]);
        } catch (e) { console.error(e); }

        // Check Maintenance
        if (settingsList[0]?.maintenance_mode) {
            return Response.json({ error: 'Minting disabled for maintenance.' }, { status: 503 });
        }

        if (identities[0]?.banned) {
            return Response.json({ error: 'Identity suspended.' }, { status: 403 });
        }

        // 3. Generate Identity Name (Standalone)
        // We use a standalone name to avoid dependency on a parent domain existing on Devnet
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const subdomain = `etherene-node-${randomSuffix}`; // This is now the full name
        // const fullDomain = `${subdomain}`;

        // 4. Generate AI Image (Avatar)
        const bio = identities[0]?.bio || `Etherene Node ${subdomain}`;
        const prompt = `Abstract spiritual digital art, sacred geometry, node ${subdomain}, ${bio}. Cyberpunk, 8k, blue purple.`;
        
        let imageRes;
        try {
            imageRes = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
        } catch (e) {
             imageRes = { url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop" };
        }

        // 5. Setup Transaction
        const connection = new Connection("https://api.devnet.solana.com", "confirmed");
        const transaction = new Transaction();

        // Calculate Fee ($3)
        let lamportsForFee = 20_000_000;
        try {
            const priceReq = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            const data = await priceReq.json();
            if (data.solana?.usd) lamportsForFee = Math.round((3 / data.solana.usd) * LAMPORTS_PER_SOL);
        } catch (e) {}

        // A. Fee Transfer
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: serverKeypair.publicKey,
                lamports: lamportsForFee
            })
        );

        // B. SNS Name Minting (Root Name)
        // We mint a root name directly to ensure success without parent domain setup
        
        // Instruction to create name
        const space = 1000;
        const lamports = await connection.getMinimumBalanceForRentExemption(space);

        const createNameIx = await createNameRegistry(
            connection,
            subdomain,
            space,
            userPublicKey, // Payer
            userPublicKey, // Owner
            lamports,
            new PublicKey("11111111111111111111111111111111"), // Class (None)
            undefined // No parent
        );

        transaction.add(createNameIx);

        // 6. Finalize
        transaction.feePayer = userPublicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        // Server only signs if it's the fee receiver (it is) or parent owner (it isn't here)
        // But since we are transferring TO the server, the server doesn't strictly need to sign the transfer.
        // HOWEVER: If we used the server as the payer for rent, it would need to sign.
        // Here user pays rent. 
        // We included serverKeypair in the previous logic for parent auth. 
        // Now it's not needed for the instruction, BUT we can keep it as a cosigner if we want to enforce server authority later.
        // For now, removing the partialSign requirement if it's not a signer in any instruction avoids errors.
        
        // Check if serverKeypair is actually required as a signer in any instruction
        // 1. Transfer: user -> server (server is not signer)
        // 2. CreateRegistry: user pays (server is not signer, no parent)
        
        // So we DON'T need server signature on the transaction itself anymore.
        // transaction.partialSign(serverKeypair);

        const serializedTransaction = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false
        });

        return Response.json({ 
            success: true, 
            transaction: Buffer.from(serializedTransaction).toString('base64'),
            subdomain: `${subdomain}.sol`,
            imageUrl: imageRes.url
        });

    } catch (error) {
        console.error("Mint setup error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});