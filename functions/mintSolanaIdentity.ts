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
  ComputeBudgetProgram,
  TransactionInstruction
  } from 'npm:@solana/web3.js@^1.91.0';
import { 
  getDomainKey, 
  createNameRegistry,
  NameRegistryState,
  updateInstruction
} from 'npm:@bonfida/spl-name-service@^2.3.1';
import { serialize } from 'npm:borsh@^1.0.0';
import bs58 from 'npm:bs58@5.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const NAME_PROGRAM_ID = new PublicKey("namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX");
        
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

        // 1. Load Server Key
        console.log("Loading server key...");
        const privateKeyString = Deno.env.get("SOLANA_PAYER_PRIVATE_KEY");
        if (!privateKeyString) throw new Error("Missing SOLANA_PAYER_PRIVATE_KEY");
        
        let serverKeypair;
        try {
            const secretKey = privateKeyString.trim().startsWith('[') 
                ? Uint8Array.from(JSON.parse(privateKeyString))
                : bs58.decode(privateKeyString.trim());
            serverKeypair = Keypair.fromSecretKey(secretKey);
        } catch (e) {
            throw new Error(`Key parse failed: ${e.message}`);
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

        // 3. Generate Subdomain Name
        // We generate a subdomain under 'etherene'
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const subdomain = `node-${randomSuffix}`; 
        // The full name will be node-xyz.etherene

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
        console.log("Connecting to Solana Mainnet...");
        const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
        const transaction = new Transaction();

        // Add Compute Budget (Priority Fee might be needed, but standard limit helps)
        transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }));

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

        // B. SNS Subdomain Minting
        console.log("Deriving parent key...");
        const SOL_TLD = new PublicKey("58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9ZP11");
        const { pubkey: parentNameKey } = await getDomainKey("etherene", SOL_TLD);
        console.log("Parent key derived:", parentNameKey.toBase58());

        // 1. Verify Parent Ownership
        try {
            const { registry } = await NameRegistryState.retrieve(connection, parentNameKey);
            if (!registry.owner.equals(serverKeypair.publicKey)) {
                console.error(`Parent owner mismatch. Expected: ${registry.owner.toBase58()}, Server: ${serverKeypair.publicKey.toBase58()}`);
                throw new Error("Server key does not own the parent 'etherene.sol' domain. Cannot mint subdomain.");
            }
        } catch (e) {
            console.error("Parent verification failed:", e);
            throw new Error(`Failed to verify parent domain 'etherene.sol': ${e.message}`);
        }

        // Check Balance
        const balance = await connection.getBalance(serverKeypair.publicKey);
        if (balance < 0.001 * LAMPORTS_PER_SOL) {
             console.warn(`Server balance low: ${balance / LAMPORTS_PER_SOL} SOL`);
        }

        // Check if subdomain already exists (collision check)
        const { pubkey: subdomainKey } = await getDomainKey(subdomain, parentNameKey);
        const subdomainInfo = await connection.getAccountInfo(subdomainKey);
        if (subdomainInfo) {
            return Response.json({ error: `Subdomain '${subdomain}' already exists. Please try again.` }, { status: 409 });
        }

        console.log("Creating registry instruction...");
        // 1KB space to store metadata/name/reverse lookup info if needed
        const space = 1000; 
        // Rent must cover space + NameRegistryState.HEADER_LEN (96 bytes)
        const lamports = await connection.getMinimumBalanceForRentExemption(space + 96);

        const createSubdomainIx = await createNameRegistry(
            connection,
            subdomain,
            space,
            userPublicKey, // Payer
            userPublicKey, // Owner
            lamports,
            PublicKey.default, // Class (SystemProgram - effectively no class)
            parentNameKey
        );

        // CRITICAL FIX: Ensure SystemProgram (Class) is NOT marked as a signer
        createSubdomainIx.keys.forEach(key => {
            if (key.pubkey.toBase58() === "11111111111111111111111111111111") {
                key.isSigner = false;
            }
        });

        transaction.add(createSubdomainIx);

        // Note: We skipping explicit name storage in the data to avoid "invalid account data" errors
        // and library incompatibility issues. The identity is verified via address derivation.
        // Recovery can be done via transaction history analysis.

        // 6. Finalize
        transaction.feePayer = userPublicKey;
        // Use finalized blockhash for better validity window
        const { blockhash } = await connection.getLatestBlockhash('finalized');
        transaction.recentBlockhash = blockhash;

        // Partial Sign by Server (Authority of parent domain)
        transaction.partialSign(serverKeypair);

        const serializedTransaction = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false
        });

        return Response.json({ 
            success: true, 
            transaction: Buffer.from(serializedTransaction).toString('base64'),
            subdomain: `${subdomain}.etherene.sol`,
            imageUrl: imageRes.url
        });

    } catch (error) {
        console.error("Mint setup error:", error);
        return Response.json({ error: `Backend Error: ${error.message} - ${error.stack}` }, { status: 500 });
    }
});