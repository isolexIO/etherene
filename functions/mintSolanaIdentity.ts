import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { Buffer } from "node:buffer";
import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction, 
  SystemProgram 
} from 'npm:@solana/web3.js@^1.91.0';
import { 
  createInitializeMintInstruction, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction, 
  createMintToInstruction, 
  TOKEN_PROGRAM_ID, 
  MINT_SIZE 
} from 'npm:@solana/spl-token@^0.4.0';
import bs58 from 'npm:bs58@5.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { userAddress } = await req.json();

        if (!userAddress) {
            return Response.json({ error: 'User address required' }, { status: 400 });
        }

        const privateKeyString = Deno.env.get("SOLANA_PAYER_PRIVATE_KEY");
        if (!privateKeyString) {
            return Response.json({ error: 'Server configuration error: Missing Payer Key' }, { status: 500 });
        }

        // Decode private key
        let secretKey;
        if (privateKeyString.includes('[')) {
            secretKey = Uint8Array.from(JSON.parse(privateKeyString));
        } else {
            secretKey = bs58.decode(privateKeyString);
        }
        const serverKeypair = Keypair.fromSecretKey(secretKey);

        const connection = new Connection("https://api.devnet.solana.com", "confirmed");

        // 1. Setup Keys
        const mintKeypair = Keypair.generate();
        const userPublicKey = new PublicKey(userAddress);
        const lamportsForMintRent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

        // 2. Calculate Price ($5 in SOL)
        let lamportsFor5USD = 50_000_000; // Default 0.05 SOL (~$5 if SOL=100)
        try {
            const priceReq = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            const priceData = await priceReq.json();
            const solPrice = priceData.solana.usd;
            lamportsFor5USD = Math.round((5 / solPrice) * 1_000_000_000);
        } catch (e) {
            console.error("Failed to fetch price, using fallback");
        }

        const transaction = new Transaction();

        // 3. Add Instructions
        
        // A. Create Mint Account (Paid by User)
        transaction.add(
            SystemProgram.createAccount({
                fromPubkey: userPublicKey, // User pays rent
                newAccountPubkey: mintKeypair.publicKey,
                space: MINT_SIZE,
                lamports: lamportsForMintRent,
                programId: TOKEN_PROGRAM_ID,
            }),
            createInitializeMintInstruction(
                mintKeypair.publicKey,
                0, // 0 decimals for NFT
                serverKeypair.publicKey, // Mint Authority = Server
                serverKeypair.publicKey, // Freeze Authority = Server
                TOKEN_PROGRAM_ID
            )
        );

        // B. Get ATA
        const associatedTokenAddress = await getAssociatedTokenAddress(
            mintKeypair.publicKey,
            userPublicKey
        );

        // C. Create ATA (Paid by User)
        transaction.add(
            createAssociatedTokenAccountInstruction(
                userPublicKey, // Payer of rent = User
                associatedTokenAddress,
                userPublicKey, // Owner
                mintKeypair.publicKey
            )
        );

        // D. Mint 1 Token (Signed by Server Authority)
        transaction.add(
            createMintToInstruction(
                mintKeypair.publicKey,
                associatedTokenAddress,
                serverKeypair.publicKey, // Authority
                1,
                [],
                TOKEN_PROGRAM_ID
            )
        );

        // E. Transfer $5 (User -> Server)
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: serverKeypair.publicKey,
                lamports: lamportsFor5USD
            })
        );

        // 4. Setup Transaction
        transaction.feePayer = userPublicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        // 5. Sign (Partial)
        // Signers needed: 
        // - userPublicKey (Frontend)
        // - mintKeypair (Backend - new account)
        // - serverKeypair (Backend - mint authority)
        transaction.partialSign(mintKeypair, serverKeypair);

        // 6. Serialize
        const serializedTransaction = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false
        });

        return Response.json({ 
            success: true, 
            transaction: Buffer.from(serializedTransaction).toString('base64'),
            mint: mintKeypair.publicKey.toString(),
            message: `Minting Identity NFT for ~$5`
        });

    } catch (error) {
        console.error("Minting setup failed:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});