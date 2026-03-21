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
  NameRegistryState
} from 'npm:@bonfida/spl-name-service@^2.3.1';
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
        console.log("Connecting to Solana...");
        const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
        const transaction = new Transaction();

        // Add Compute Budget (Priority Fee might be needed, but standard limit helps)
        transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }));

        // Calculate Fee ($3)
        let lamportsForFee = 20_000_000;
        let feeInSol = 0.02;
        try {
            const priceReq = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            const data = await priceReq.json();
            if (data.solana?.usd) {
                lamportsForFee = Math.round((3 / data.solana.usd) * LAMPORTS_PER_SOL);
                feeInSol = lamportsForFee / LAMPORTS_PER_SOL;
            }
        } catch (e) {
            feeInSol = lamportsForFee / LAMPORTS_PER_SOL;
        }

        console.log(`Platform fee: ${feeInSol.toFixed(4)} SOL (~$3 USD)`);

        // A. Fee Transfer (FIRST - before minting)
        const feeInstruction = SystemProgram.transfer({
            fromPubkey: userPublicKey,
            toPubkey: serverKeypair.publicKey,
            lamports: lamportsForFee
        });
        transaction.add(feeInstruction);

        // B. SNS Subdomain Minting
         console.log("Deriving parent key...");
         const SOL_TLD = new PublicKey("58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9ZP11");
         let parentNameKey;
         try {
             const result = await getDomainKey("etherene", SOL_TLD);
             parentNameKey = result.pubkey;
         } catch (e) {
             throw new Error(`Failed to derive parent domain key: ${e.message}`);
         }
         console.log("Parent key derived:", parentNameKey.toBase58());

         // 1. Verify Parent Ownership
         try {
             const parentState = await NameRegistryState.retrieve(connection, parentNameKey);
             if (!parentState.owner.equals(serverKeypair.publicKey)) {
                 console.error(`Parent owner mismatch. Expected: ${parentState.owner.toBase58()}, Server: ${serverKeypair.publicKey.toBase58()}`);
                 throw new Error("Server key does not own the parent 'etherene.sol' domain. Cannot mint subdomain.");
             }
         } catch (e) {
             console.error("Parent verification failed:", e.message);
             throw new Error(`Failed to verify parent domain 'etherene.sol': ${e.message}`);
         }

        // Check Balance
        const balance = await connection.getBalance(serverKeypair.publicKey);
        if (balance < 0.001 * LAMPORTS_PER_SOL) {
             console.warn(`Server balance low: ${balance / LAMPORTS_PER_SOL} SOL`);
        }



        console.log("Creating subdomain...");

        // 1. Calculate Space & Rent
        const space = 1000;
        const rentLamports = await connection.getMinimumBalanceForRentExemption(space + 96);

        // 2. Check User Balance (rent + platform fee + tx fees)
        const userBalance = await connection.getBalance(userPublicKey);
        const estimatedTxFee = 10000;
        const requiredFunds = rentLamports + lamportsForFee + estimatedTxFee;

        if (userBalance < requiredFunds) {
            const missing = (requiredFunds - userBalance) / LAMPORTS_PER_SOL;
            throw new Error(`Insufficient funds. Need ${(requiredFunds/LAMPORTS_PER_SOL).toFixed(4)} SOL (${(lamportsForFee/LAMPORTS_PER_SOL).toFixed(4)} platform fee + ${(rentLamports/LAMPORTS_PER_SOL).toFixed(4)} rent + fees) but have ${(userBalance/LAMPORTS_PER_SOL).toFixed(4)} SOL.`);
        }

        // 3. Create subdomain instruction
        const { getHashedName, getNameAccountKey } = await import('npm:@bonfida/spl-name-service@^2.3.1');

        let hashedName, subdomainKey;
        try {
            hashedName = await getHashedName(subdomain);
            subdomainKey = await getNameAccountKey(hashedName, undefined, parentNameKey);
        } catch (e) {
            throw new Error(`Failed to derive subdomain key: ${e.message}`);
        }

        console.log("Subdomain account:", subdomainKey.toBase58());

        // Build instruction data (Create instruction format for SNS)
        // Format: [1 byte opcode (0=Create)] + [32 bytes hashedName] + [4 bytes space] + [8 bytes rent]
        const instructionData = Buffer.alloc(1 + 32 + 4 + 8);
        instructionData.writeUInt8(0, 0); // Opcode: Create
        hashedName.copy(instructionData, 1);
        instructionData.writeUInt32LE(space + 96, 33); // Space
        instructionData.writeBigUInt64LE(BigInt(rentLamports), 37); // Rent

        const createInstruction = new TransactionInstruction({
            keys: [
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                { pubkey: userPublicKey, isSigner: true, isWritable: true },
                { pubkey: subdomainKey, isSigner: false, isWritable: true },
                { pubkey: userPublicKey, isSigner: false, isWritable: false },
                { pubkey: parentNameKey, isSigner: false, isWritable: false },
                { pubkey: serverKeypair.publicKey, isSigner: true, isWritable: false },
            ],
            programId: NAME_PROGRAM_ID,
            data: instructionData
        });

        transaction.add(createInstruction);

        // 6. Finalize
        transaction.feePayer = userPublicKey;
        // Get fresh blockhash
        let blockhash;
        try {
            const latestBlock = await connection.getLatestBlockhash('confirmed');
            blockhash = latestBlock.blockhash;
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = latestBlock.lastValidBlockHeight;
        } catch (e) {
            throw new Error(`Failed to get blockhash: ${e.message}`);
        }

        // Server signs as the parent domain owner (authority for subdomain creation)
        try {
            transaction.partialSign(serverKeypair);
        } catch (e) {
            throw new Error(`Failed to sign transaction: ${e.message}`);
        }

        let serializedTransaction;
        try {
            serializedTransaction = transaction.serialize({
                requireAllSignatures: false,
                verifySignatures: false
            });
        } catch (e) {
            throw new Error(`Failed to serialize transaction: ${e.message}`);
        }

        return Response.json({ 
            success: true, 
            transaction: Buffer.from(serializedTransaction).toString('base64'),
            subdomain: `${subdomain}.etherene.sol`,
            imageUrl: imageRes.url,
            feeAmount: feeInSol,
            feeAmountUSD: 3
        });

    } catch (error) {
        console.error("Mint setup error:", error);
        return Response.json({ error: `Backend Error: ${error.message} - ${error.stack}` }, { status: 500 });
    }
});