import { Connection } from 'npm:@solana/web3.js@1.98.4';

const PRIMARY_RPC = 'https://solana-rpc.publicnode.com';
const FALLBACK_RPC = 'https://api.mainnet-beta.solana.com';

export default function createSolanaConnection() {
  return new Connection(PRIMARY_RPC, {
    commitment: 'confirmed',
    disableRetryOnRateLimit: true,
    fetch: async (url, options) => {
      const response = await fetch(url, options);
      if (response.status !== 429) return response;
      // Retry the same mainnet request once, not the entire paid mint.
      return fetch(FALLBACK_RPC, options);
    },
  });
}