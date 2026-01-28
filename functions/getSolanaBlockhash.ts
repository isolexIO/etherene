import { Connection } from 'npm:@solana/web3.js@^1.91.0';

Deno.serve(async (req) => {
    try {
        const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
        
        return Response.json({ success: true, blockhash, lastValidBlockHeight });

    } catch (error) {
        console.error("Error getting Solana blockhash:", error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});