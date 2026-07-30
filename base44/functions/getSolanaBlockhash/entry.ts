import { Connection } from 'npm:@solana/web3.js@^1.91.0';

// Public mainnet-beta now 403s many browser + backend requests, so we try a
// short list of free, CORS-friendly endpoints and use whichever responds.
const ENDPOINTS = [
  "https://api.mainnet-beta.solana.com",
  "https://solana-rpc.publicnode.com",
  "https://rpc.ankr.com/solana",
  "https://solana-mainnet.core.api.stakehouse.space",
];

Deno.serve(async (req) => {
  const errors = [];
  for (const ep of ENDPOINTS) {
    try {
      const connection = new Connection(ep, "confirmed");
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      if (blockhash) {
        return Response.json({
          success: true,
          blockhash,
          lastValidBlockHeight,
          endpoint: ep,
        });
      }
    } catch (error) {
      errors.push(`${ep}: ${error.message}`);
    }
  }
  return Response.json(
    { success: false, error: "All RPC endpoints failed", errors },
    { status: 502 }
  );
});