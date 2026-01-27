import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { Buffer } from "node:buffer";

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL
} from 'npm:@solana/web3.js@^1.91.0';
import bs58 from 'npm:bs58@5.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const body = await req.json();
        const { userAddress, mintTxSignature } = body;
        
        if (!userAddress || !mintTxSignature) {
            return Response.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // 1. Verify the mint transaction succeeded on-chain
        const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
        
        let txInfo;
        try {
            txInfo = await connection.getTransaction(mintTxSignature, {
                maxSupportedTransactionVersion: 0
            });
        } catch (e) {
            return Response.json({ error: 'Transaction not found or not confirmed yet' }, { status: 400 });
        }

        if (!txInfo || txInfo.meta?.err) {
            return Response.json({ error: 'Mint transaction failed or invalid' }, { status: 400 });
        }

        // 2. Check if already charged
        const existing = await base44.asServiceRole.entities.Identity.filter({ 
            address: userAddress 
        });
        
        if (existing[0]?.fee_charged) {
            return Response.json({ success: true, message: 'Fee already charged' });
        }

        // 3. Load server key
        const privateKeyString = Deno.env.get("SOLANA_PAYER_PRIVATE_KEY");
        if (!privateKeyString) throw new Error("Missing SOLANA_PAYER_PRIVATE_KEY");
        
        const secretKey = privateKeyString.trim().startsWith('[') 
            ? Uint8Array.from(JSON.parse(privateKeyString))
            : bs58.decode(privateKeyString.trim());
        const serverKeypair = Keypair.fromSecretKey(secretKey);

        // 4. Calculate fee ($3 USD)
        let lamportsForFee = 20_000_000; // fallback
        try {
            const priceReq = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            const data = await priceReq.json();
            if (data.solana?.usd) {
                lamportsForFee = Math.round((3 / data.solana.usd) * LAMPORTS_PER_SOL);
            }
        } catch (e) {
            console.error("Price fetch failed, using fallback fee");
        }

        // 5. Create fee collection transaction
        const userPubkey = new PublicKey(userAddress);
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: userPubkey,
                toPubkey: serverKeypair.publicKey,
                lamports: lamportsForFee
            })
        );

        transaction.feePayer = userPubkey;
        const { blockhash } = await connection.getLatestBlockhash('finalized');
        transaction.recentBlockhash = blockhash;

        const serialized = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false
        });

        return Response.json({ 
            success: true, 
            feeTransaction: Buffer.from(serialized).toString('base64'),
            feeAmount: (lamportsForFee / LAMPORTS_PER_SOL).toFixed(4)
        });

    } catch (error) {
        console.error("Fee charging error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});