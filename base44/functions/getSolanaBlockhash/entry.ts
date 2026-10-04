import { solanaConnection } from '../../shared/solanaIdentity.ts';

export default async function(req) {
  try {
    const { blockhash, lastValidBlockHeight } = await solanaConnection().getLatestBlockhash('confirmed');
    return Response.json({ success: true, blockhash, lastValidBlockHeight, endpoint: 'https://solana-rpc.publicnode.com' });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 502 });
  }
}