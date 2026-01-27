import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Buffer } from "node:buffer";

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

import { Connection, Transaction } from 'npm:@solana/web3.js@^1.91.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Authenticate user
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { signedTransaction } = body;

        if (!signedTransaction) {
            return Response.json({ error: 'Missing signed transaction' }, { status: 400 });
        }

        // Deserialize and send transaction
        const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
        const txBuffer = Buffer.from(signedTransaction, 'base64');
        const transaction = Transaction.from(txBuffer);

        const signature = await connection.sendRawTransaction(
            transaction.serialize(),
            {
                skipPreflight: false,
                preflightCommitment: 'confirmed'
            }
        );

        // Wait for confirmation
        await connection.confirmTransaction(signature, 'confirmed');

        return Response.json({ 
            success: true, 
            signature 
        });

    } catch (error) {
        console.error("Send transaction error:", error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});