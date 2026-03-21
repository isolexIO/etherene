import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { Buffer } from "node:buffer";
if (typeof globalThis.Buffer === 'undefined') globalThis.Buffer = Buffer;

import { Connection, PublicKey, Transaction } from 'npm:@solana/web3.js@^1.91.0';
import { deleteInstruction } from 'npm:@bonfida/spl-name-service@^2.3.1';

Deno.serve(async (req) => {
    try {
        const body = await req.json();
        const { accountKey, userAddress } = body;
        
        const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
        const nameAccount = new PublicKey(accountKey);
        const user = new PublicKey(userAddress);
        const NAME_PROGRAM_ID = new PublicKey("namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX");

        // deleteInstruction(programId, nameKey, refundTarget, nameOwner)
        const ix = deleteInstruction(
            NAME_PROGRAM_ID,
            nameAccount,
            user, // Refund to user
            user  // Owner is user
        );

        const tx = new Transaction().add(ix);
        tx.feePayer = user;
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;

        const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });

        return Response.json({ transaction: serialized.toString('base64') });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
});