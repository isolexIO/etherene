import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from 'npm:@solana/web3.js@1.98.4';
import { solanaConnection, mintSettings, quoteMintFee, NAME_PROGRAM_ID } from '../../shared/solanaIdentity.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { userAddress, mintTxSignature } = await req.json();
    if (!userAddress || !mintTxSignature) return Response.json({ error: 'Wallet address and mint signature required' }, { status: 400 });
    const owner = new PublicKey(userAddress);
    const connection = solanaConnection();
    const tx = await connection.getParsedTransaction(mintTxSignature, { maxSupportedTransactionVersion: 0, commitment: 'confirmed' });
    if (!tx?.meta || tx.meta.err || !tx.transaction.message.accountKeys.some(key => key.signer && key.pubkey.equals(owner)) || !tx.transaction.message.instructions.some(ix => ix.programId?.equals(NAME_PROGRAM_ID))) return Response.json({ error: 'A successful identity mint signed by this wallet is required.' }, { status: 400 });
    const identity = (await base44.entities.Identity.filter({ address: owner.toBase58() }))[0];
    const settings = await mintSettings(base44);
    if (identity?.fee_charged || tx.transaction.message.instructions.some(ix => ix.program === 'system' && ix.parsed?.type === 'transfer' && ix.parsed.info.source === owner.toBase58() && ix.parsed.info.destination === settings.admin_wallet && Number(ix.parsed.info.lamports) > 0)) return Response.json({ success: true, alreadyCharged: true, message: 'Platform fee already included in the mint.' });
    const { lamports } = await quoteMintFee(settings);
    const feeTx = new Transaction().add(SystemProgram.transfer({ fromPubkey: owner, toPubkey: new PublicKey(settings.admin_wallet), lamports }));
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    feeTx.feePayer = owner;
    feeTx.recentBlockhash = blockhash;
    return Response.json({ success: true, feeTransaction: feeTx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64'), feeAmount: (lamports / LAMPORTS_PER_SOL).toFixed(4), blockhash, lastValidBlockHeight });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}