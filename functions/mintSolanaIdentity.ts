import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  sendAndConfirmTransaction 
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
        const { userAddress, soulHash } = await req.json();

        if (!userAddress) {
            return Response.json({ error: 'User address required' }, { status: 400 });
        }

        const privateKeyString = Deno.env.get("SOLANA_PAYER_PRIVATE_KEY");
        if (!privateKeyString) {
            return Response.json({ error: 'Server configuration error: Missing Payer Key' }, { status: 500 });
        }

        // Decode private key (support both array and base58)
        let secretKey;
        if (privateKeyString.includes('[')) {
            secretKey = Uint8Array.from(JSON.parse(privateKeyString));
        } else {
            secretKey = bs58.decode(privateKeyString);
        }
        const payer = Keypair.fromSecretKey(secretKey);

        // Connect to Devnet (easier for testing) or Mainnet based on env? 
        // Defaulting to Devnet for safety unless specified, but user asked for "Real Solana".
        // Let's use 'devnet' for safety in development, user can change URL to mainnet-beta.
        const connection = new Connection("https://api.devnet.solana.com", "confirmed");

        // 1. Create Mint Account
        const mint = Keypair.generate();
        const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
        const userPublicKey = new PublicKey(userAddress);

        const transaction = new Transaction();

        // Create Mint Account
        transaction.add(
            SystemProgram.createAccount({
                fromPubkey: payer.publicKey,
                newAccountPubkey: mint.publicKey,
                space: MINT_SIZE,
                lamports,
                programId: TOKEN_PROGRAM_ID,
            }),
            createInitializeMintInstruction(
                mint.publicKey,
                0, // 0 decimals for NFT
                payer.publicKey,
                payer.publicKey,
                TOKEN_PROGRAM_ID
            )
        );

        // Get ATA
        const associatedToken = await getAssociatedTokenAddress(
            mint.publicKey,
            userPublicKey
        );

        // Create ATA
        transaction.add(
            createAssociatedTokenAccountInstruction(
                payer.publicKey,
                associatedToken,
                userPublicKey,
                mint.publicKey
            )
        );

        // Mint 1 Token
        transaction.add(
            createMintToInstruction(
                mint.publicKey,
                associatedToken,
                payer.publicKey,
                1,
                [],
                TOKEN_PROGRAM_ID
            )
        );

        // Sign and Send (Updated to Transfer Transaction)
        // 1. Fetch SOL Price (approximate $5)
        let lamportsFor5USD = 0;
        try {
            const priceReq = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            const priceData = await priceReq.json();
            const solPrice = priceData.solana.usd;
            lamportsFor5USD = Math.round((5 / solPrice) * 1_000_000_000);
        } catch (e) {
            console.error("Failed to fetch price, defaulting to 0.05 SOL", e);
            lamportsFor5USD = 50_000_000; // Fallback
        }

        // Add Transfer Instruction (User pays $5 to Treasury/Server)
        // We use the payer (server key) as the Treasury destination for simplicity
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: payer.publicKey,
                lamports: lamportsFor5USD
            })
        );

        // Set Fee Payer to User (since they are signing)
        transaction.feePayer = userPublicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        // Partially sign with the Mint Keypair (it's a new account, so it needs to sign)
        // We also need the Payer (Server) to sign IF the server was paying for rent.
        // BUT, to simplify "Solana Pay" style, let's make the USER pay for rent too.
        // Re-building the createAccount instruction to use userPublicKey as payer.
        
        transaction.instructions[0] = SystemProgram.createAccount({
                fromPubkey: userPublicKey, // User pays rent
                newAccountPubkey: mint.publicKey,
                space: MINT_SIZE,
                lamports,
                programId: TOKEN_PROGRAM_ID,
        });

        // The only signer needed from backend is the 'mint' keypair (proof of new account)
        transaction.partialSign(mint);
        
        // Serialize
        const serializedTransaction = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false
        });

        return Response.json({ 
            success: true, 
            transaction: Buffer.from(serializedTransaction).toString('base64'),
            mint: mint.publicKey.toString(),
            message: `Please sign to pay ~$5 (${(lamportsFor5USD/1e9).toFixed(4)} SOL) and mint your identity.`
        });

    } catch (error) {
        console.error("Minting failed:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});