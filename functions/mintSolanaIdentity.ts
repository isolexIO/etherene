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
  createInitializeMintInstruction, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction, 
  createMintToInstruction, 
  TOKEN_PROGRAM_ID, 
  MINT_SIZE 
} from 'npm:@solana/spl-token@^0.4.0';
import { 
  createCreateMetadataAccountV3Instruction 
} from 'npm:@metaplex-foundation/mpl-token-metadata@^2.13.0';
import bs58 from 'npm:bs58@5.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Parse Body
        const body = await req.json();
        let { userAddress, soulHash } = body;
        console.log("Mint request payload:", JSON.stringify(body));

        // Strict Validation
        if (!userAddress || typeof userAddress !== 'string') {
            console.error("Invalid userAddress format:", userAddress);
            return Response.json({ error: 'Solana user address required as a base58 string' }, { status: 400 });
        }

        // Clean and validate address
        userAddress = userAddress.trim();
        let userPublicKey;
        try {
            if (userAddress === 'undefined' || userAddress === 'null') {
                throw new Error("Address is " + userAddress);
            }
            userPublicKey = new PublicKey(userAddress);
            if (!PublicKey.isOnCurve(userPublicKey.toBytes())) {
                 console.warn("Public key is not on curve (PDA?):", userAddress);
            }
        } catch (e) {
            console.error("Public key validation failed for:", userAddress, e);
            return Response.json({ error: `Invalid public key input: ${userAddress}. Ensure you are using a valid Solana wallet address.` }, { status: 400 });
        }

        // 1. Load Server Key (Treasury & Authority)
        const privateKeyString = Deno.env.get("SOLANA_PAYER_PRIVATE_KEY");
        if (!privateKeyString) {
            return Response.json({ error: 'Server Missing Payer Key' }, { status: 500 });
        }
        let secretKey;
        try {
            if (privateKeyString.trim().startsWith('[') || privateKeyString.includes(',')) {
                secretKey = Uint8Array.from(JSON.parse(privateKeyString));
            } else {
                secretKey = bs58.decode(privateKeyString.trim());
            }
        } catch (e) {
            console.error("Failed to parse private key", e);
            return Response.json({ error: 'Server Configuration Error: Invalid Payer Key' }, { status: 500 });
        }

        let serverKeypair;
        try {
            serverKeypair = Keypair.fromSecretKey(secretKey);
        } catch (e) {
            console.error("Invalid secret key size/format", e);
            return Response.json({ error: 'Server Configuration Error: Invalid Keypair' }, { status: 500 });
        }

        // 2. Fetch User Context for AI & Settings
        // Use userAddress directly as the identity key
        const ethAddress = userAddress; 

        // Parallel fetch with error handling
        let identities = [], transmissions = [], settingsList = [];
        try {
            [identities, transmissions, settingsList] = await Promise.all([
                 base44.asServiceRole.entities.Identity.filter({ address: ethAddress }),
                 base44.asServiceRole.entities.Transmission.filter({ author_address: ethAddress }),
                 base44.asServiceRole.entities.GlobalSettings.list()
            ]);
        } catch (e) {
            console.error("Failed to fetch entity data", e);
            // Continue with defaults
        }

        // Check Maintenance Mode
        const settings = settingsList.length > 0 ? settingsList[0] : null;
        if (settings?.maintenance_mode) {
            return Response.json({ error: 'Minting is currently disabled for maintenance.' }, { status: 503 });
        }

        const identity = identities[0];

        // Check Ban Status
        if (identity?.banned) {
            return Response.json({ error: 'This identity has been suspended.' }, { status: 403 });
        }

        // 3. Generate AI Image
        const bio = identity?.bio || `A mysterious node in the Etherene network: ${ethAddress.slice(0, 6)}...`;
        const signals = transmissions.map(t => t.content).join(' ').slice(0, 100);

        const prompt = `
        Abstract spiritual digital art, sacred geometry, ethereal glowing lines, blockchain nodes connecting in the void.
        Theme: ${bio}. 
        Essence: ${signals}.
        Style: Cyberpunk meets Mysticism, high quality, 8k, octane render, blue and purple palette.
        `;

        // Start Image Gen
        let imageRes;
        try {
            imageRes = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
        } catch (e) {
             console.error("Image generation failed", e);
             // Fallback image
             imageRes = { url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop" };
        }

        if (!imageRes?.url) {
             imageRes = { url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop" };
        }

        // 4. Upload Metadata
        const metadataJson = {
            name: identity?.display_name || "Etherene Node",
            symbol: "ETHN",
            description: `Identity Node for ${ethAddress}. ${bio}`,
            image: imageRes.url,
            attributes: [
                { trait_type: "Network", value: "Etherene" },
                { trait_type: "Role", value: "Node" },
                { trait_type: "Transmissions", value: transmissions.length.toString() }
            ]
        };

        const metadataUri = imageRes.url; 

        // 5. Setup Transaction
        const connection = new Connection("https://api.devnet.solana.com", "confirmed");
        const mintKeypair = Keypair.generate();
        // userPublicKey is already defined above

        // Calculate Price ($3 platform fee)
        let lamportsForFee = 20_000_000; // ~0.02 SOL default
        try {
            const priceReq = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            const data = await priceReq.json();
            if (data.solana?.usd) {
                lamportsForFee = Math.round((3 / data.solana.usd) * LAMPORTS_PER_SOL);
            }
            } catch (e) { console.error("Price fetch failed", e); }

            if (!Number.isFinite(lamportsForFee) || lamportsForFee <= 0) {
            lamportsForFee = 20_000_000;
            }

        const transaction = new Transaction();

        // 0. Increase Compute Budget (Metadata operations can be heavy)
        transaction.add(
            ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 })
        );

        // A. Transfer Payment (User -> Server)
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: serverKeypair.publicKey,
                lamports: lamportsForFee
            })
        );

        // B. Create Mint Account (User pays rent)
        const mintRent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
        transaction.add(
            SystemProgram.createAccount({
                fromPubkey: userPublicKey,
                newAccountPubkey: mintKeypair.publicKey,
                space: MINT_SIZE,
                lamports: mintRent,
                programId: TOKEN_PROGRAM_ID,
            }),
            createInitializeMintInstruction(
                mintKeypair.publicKey,
                0, 
                serverKeypair.publicKey, 
                serverKeypair.publicKey, 
                TOKEN_PROGRAM_ID
            )
        );

        // C. Create ATA
        const ata = await getAssociatedTokenAddress(mintKeypair.publicKey, userPublicKey);
        transaction.add(
            createAssociatedTokenAccountInstruction(
                userPublicKey,
                ata,
                userPublicKey,
                mintKeypair.publicKey
            )
        );

        // D. Mint Token
        transaction.add(
            createMintToInstruction(
                mintKeypair.publicKey,
                ata,
                serverKeypair.publicKey,
                1,
                [],
                TOKEN_PROGRAM_ID
            )
        );

        // E. Add Metadata
        const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm36Sc18nhZ5613NY");
        const [metadataAddress] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mintKeypair.publicKey.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        );

        const metadataInstruction = createCreateMetadataAccountV3Instruction(
            {
                metadata: metadataAddress,
                mint: mintKeypair.publicKey,
                mintAuthority: serverKeypair.publicKey,
                payer: userPublicKey,
                updateAuthority: serverKeypair.publicKey,
            },
            {
                createMetadataAccountArgsV3: {
                    data: {
                        name: metadataJson.name,
                        symbol: metadataJson.symbol,
                        uri: metadataUri,
                        sellerFeeBasisPoints: 0,
                        creators: [{ address: serverKeypair.publicKey, verified: true, share: 100 }],
                        collection: null,
                        uses: null,
                    },
                    isMutable: true,
                    collectionDetails: null,
                },
            }
        );
        transaction.add(metadataInstruction);

        // 6. Finalize & Sign
        transaction.feePayer = userPublicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        // Partial Sign (Mint + Server)
        transaction.partialSign(mintKeypair, serverKeypair);

        const serializedTransaction = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false
        });

        return Response.json({ 
            success: true, 
            transaction: Buffer.from(serializedTransaction).toString('base64'),
            mint: mintKeypair.publicKey.toString(),
            imageUrl: imageRes.url
        });

    } catch (error) {
        console.error("Mint setup error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});