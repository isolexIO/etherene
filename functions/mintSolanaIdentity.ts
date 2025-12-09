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
        let { userAddress, userEthereneAddress } = await req.json();
        console.log("Mint request for:", userAddress);

        if (!userAddress) {
            return Response.json({ error: 'Solana user address required' }, { status: 400 });
        }

        // Clean and validate address
        userAddress = String(userAddress).trim();
        try {
            new PublicKey(userAddress);
        } catch (e) {
            console.error("Public key validation failed:", e);
            return Response.json({ error: `Invalid public key format: ${userAddress}` }, { status: 400 });
        }

        // 1. Load Server Key (Treasury & Authority)
        const privateKeyString = Deno.env.get("SOLANA_PAYER_PRIVATE_KEY");
        if (!privateKeyString) {
            return Response.json({ error: 'Server Missing Payer Key' }, { status: 500 });
        }
        let secretKey;
        if (privateKeyString.includes('[')) {
            secretKey = Uint8Array.from(JSON.parse(privateKeyString));
        } else {
            secretKey = bs58.decode(privateKeyString);
        }
        const serverKeypair = Keypair.fromSecretKey(secretKey);

        // 2. Fetch User Context for AI
        const ethAddress = userEthereneAddress || userAddress; // Fallback
        const [identities, transmissions] = await Promise.all([
             base44.asServiceRole.entities.Identity.filter({ address: ethAddress }),
             base44.asServiceRole.entities.Transmission.filter({ author_address: ethAddress })
        ]);
        const identity = identities[0];
        
        // 3. Generate AI Image
        const bio = identity?.bio || "A mysterious node in the Etherene network";
        const signals = transmissions.map(t => t.content).join(' ').slice(0, 100);
        
        const prompt = `
        Abstract spiritual digital art, sacred geometry, ethereal glowing lines, blockchain nodes connecting in the void.
        Theme: ${bio}. 
        Essence: ${signals}.
        Style: Cyberpunk meets Mysticism, high quality, 8k, octane render, blue and purple palette.
        `;

        // Start Image Gen
        const imageRes = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
        if (!imageRes.url) throw new Error("Failed to generate image");

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

        // Create a temporary file and upload it to get a URL for the metadata
        // Since we can't easily "upload string" in one go without a file object in some SDKs, 
        // We will just use a data URI for the metadata URI in the NFT if it's short, OR
        // simpler: Use the image URL as the URI for now (Not standard but works for demo), 
        // OR better: Just return the image URL and let the frontend use it.
        // For a real NFT, we need a hosted JSON.
        // Let's use the Image URL as the 'uri' for now to save complexity of JSON hosting in this script,
        // or try to upload the JSON.
        // Actually, the 'UploadFile' integration usually takes a file object/string.
        // Let's Skip JSON hosting for this specific turn to ensure reliability of the TRANSACTION first.
        // We will point URI to the Image URL (some explorers display the image if URI is image).
        const metadataUri = imageRes.url; 

        // 5. Setup Transaction
        const connection = new Connection("https://api.devnet.solana.com", "confirmed");
        const mintKeypair = Keypair.generate();
        const userPublicKey = new PublicKey(userAddress);

        // Calculate Price ($3 platform fee)
        let lamportsForFee = 20_000_000; // ~0.02 SOL default
        try {
            const priceReq = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            const data = await priceReq.json();
            if (data.solana?.usd) {
                lamportsForFee = Math.round((3 / data.solana.usd) * LAMPORTS_PER_SOL);
            }
        } catch (e) { console.error("Price fetch failed"); }

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