import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { PublicKey } from 'npm:@solana/web3.js@1.98.4';
import { solanaConnection, mintReceipt, parentDomainKey, NAME_PROGRAM_ID, ownedRegistry, saveIdentity } from '../../shared/solanaIdentity.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
    const { txHash, userAddress } = await req.json();
    if (!txHash || !userAddress) return Response.json({ error: 'Transaction signature and wallet address required' }, { status: 400 });
    let address;
    try { address = new PublicKey(userAddress).toBase58(); }
    catch { return Response.json({ error: 'Invalid Solana wallet address' }, { status: 400 }); }
    const connection = solanaConnection();
    const tx = await connection.getParsedTransaction(txHash, { maxSupportedTransactionVersion: 0, commitment: 'confirmed' });
    if (!tx?.meta) return Response.json({ error: 'Transaction not found or not confirmed yet' }, { status: 404 });
    if (tx.meta.err) return Response.json({ error: 'This transaction failed on-chain and cannot be recovered.' }, { status: 400 });
    if (!tx.transaction.message.accountKeys.some(key => key.signer && key.pubkey.toBase58() === address)) return Response.json({ error: 'This wallet did not sign the recovery transaction.' }, { status: 403 });
    if (mintReceipt(tx, user.id)) {
      const response = await base44.functions.invoke('requestMint', { userAddress: address, paymentSignature: txHash });
      return Response.json(response.data);
    }
    const parent = parentDomainKey();
    for (const key of tx.transaction.message.accountKeys.filter(key => key.writable && !key.signer)) {
      const info = await connection.getAccountInfo(key.pubkey);
      if (!info || !info.owner.equals(NAME_PROGRAM_ID) || info.data.length < 96) continue;
      if (!new PublicKey(info.data.subarray(0, 32)).equals(parent) || !new PublicKey(info.data.subarray(32, 64)).equals(new PublicKey(address))) continue;
      const label = new TextDecoder().decode(info.data.subarray(96)).replace(/\0/g, '').trim();
      if (!/^[a-z0-9-]+$/.test(label)) continue;
      const subdomain = `${label}.etherene.sol`;
      const registry = await ownedRegistry(connection, subdomain, address);
      if (!registry.pubkey.equals(key.pubkey)) continue;
      const identity = await saveIdentity(base44, user, address, { subdomain, network: 'Solana Mainnet', status: 'minted' });
      return Response.json({ success: true, subdomain, identity });
    }
    return Response.json({ success: false, reason: 'unknown_name', details: 'No recoverable domain name was stored in this transaction. Import the domain by name instead of paying again.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}