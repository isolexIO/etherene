import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Buffer } from "node:buffer";

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

import { 
    Connection, 
    PublicKey, 
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL
} from 'npm:@solana/web3.js@^1.91.0';

Deno.serve(async (req) => {
    try {
        const body = await req.json();
        const { userAddress } = body;

        if (!userAddress) {
            return Response.json({ error: 'Missing user address' }, { status: 400 });
        }

        // Calculate SOL amount for $4
        let lamportsForFee = 20_000_000; // fallback
        try {
            const priceReq = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            const data = await priceReq.json();
            if (data.solana?.usd) {
                lamportsForFee = Math.round((4 / data.solana.usd) * LAMPORTS_PER_SOL);
            }
        } catch (e) {
            console.error("Price fetch failed", e);
        }

        const feeInSol = lamportsForFee / LAMPORTS_PER_SOL;

        // Create transaction
        const adminWallet = new PublicKey("5PvZDRRtdcnLwCRNYY1VKs8y6CSFfy9PmMJ3cRjhgWK8");
        const userPubkey = new PublicKey(userAddress);

        const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
        const { blockhash } = await connection.getLatestBlockhash('finalized');

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: userPubkey,
                toPubkey: adminWallet,
                lamports: lamportsForFee
            })
        );

        transaction.recentBlockhash = blockhash;
        transaction.feePayer = userPubkey;

        // Serialize unsigned transaction
        const serialized = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false
        });

        return Response.json({ 
            success: true, 
            transaction: Buffer.from(serialized).toString('base64'),
            feeInSol
        });

    } catch (error) {
        console.error("Prepare transaction error:", error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});