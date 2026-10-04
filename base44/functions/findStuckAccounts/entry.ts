import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { PublicKey } from 'npm:@solana/web3.js@1.98.4';
import { solanaConnection, parentDomainKey, NAME_PROGRAM_ID, getDomainKeySync } from '../../shared/solanaIdentity.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { userAddress } = await req.json();
    if (!userAddress) return Response.json({ error: 'Wallet address required' }, { status: 400 });
    let address;
    try { address = new PublicKey(userAddress).toBase58(); }
    catch { return Response.json({ error: 'Invalid Solana wallet address' }, { status: 400 }); }
    const identities = await base44.entities.Identity.filter({ address });
    const knownKeys = new Set(identities.filter(identity => identity.subdomain).map(identity => getDomainKeySync(identity.subdomain).pubkey.toBase58()));
    const accounts = await solanaConnection().getProgramAccounts(NAME_PROGRAM_ID, { filters: [{ memcmp: { offset: 0, bytes: parentDomainKey().toBase58() } }, { memcmp: { offset: 32, bytes: address } }] });
    return Response.json({ accounts: accounts.filter(account => !knownKeys.has(account.pubkey.toBase58()) && account.account.data.length > 96 && account.account.data.subarray(96).every(byte => byte === 0)).map(account => ({ pubkey: account.pubkey.toBase58(), lamports: account.account.lamports })) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}