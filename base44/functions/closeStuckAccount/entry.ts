import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { PublicKey, Transaction } from 'npm:@solana/web3.js@1.98.4';
import { deleteInstruction } from 'npm:@bonfida/spl-name-service@2.3.1';
import { solanaConnection, parentDomainKey, NAME_PROGRAM_ID } from '../../shared/solanaIdentity.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { accountKey, userAddress } = await req.json();
    if (!accountKey || !userAddress) return Response.json({ error: 'Account and wallet address required' }, { status: 400 });
    const nameAccount = new PublicKey(accountKey);
    const owner = new PublicKey(userAddress);
    const connection = solanaConnection();
    const info = await connection.getAccountInfo(nameAccount);
    if (!info || !info.owner.equals(NAME_PROGRAM_ID) || info.data.length < 96 || !new PublicKey(info.data.subarray(32, 64)).equals(owner) || !new PublicKey(info.data.subarray(0, 32)).equals(parentDomainKey()) || !info.data.subarray(96).every(byte => byte === 0)) return Response.json({ error: 'Only an empty Etherene registry owned by this wallet can be reclaimed.' }, { status: 403 });
    const tx = new Transaction().add(deleteInstruction(NAME_PROGRAM_ID, nameAccount, owner, owner));
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    tx.feePayer = owner;
    tx.recentBlockhash = blockhash;
    return Response.json({ transaction: tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64'), blockhash, lastValidBlockHeight });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}