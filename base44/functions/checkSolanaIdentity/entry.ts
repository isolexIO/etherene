import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { PublicKey } from 'npm:@solana/web3.js@1.98.4';
import { solanaConnection, parentDomainKey, SNS_PARENT_DOMAIN, NAME_PROGRAM_ID, getDomainKeySync } from '../../shared/solanaIdentity.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    if (!(await base44.auth.me())) return Response.json({ error: 'Authentication required' }, { status: 401 });
    const { userAddress } = await req.json();
    if (!userAddress) return Response.json({ error: 'Wallet address required' }, { status: 400 });
    let address;
    try { address = new PublicKey(userAddress).toBase58(); }
    catch { return Response.json({ error: 'Invalid Solana wallet address' }, { status: 400 }); }
    const accounts = await solanaConnection().getProgramAccounts(NAME_PROGRAM_ID, { filters: [{ memcmp: { offset: 0, bytes: parentDomainKey().toBase58() } }, { memcmp: { offset: 32, bytes: address } }] });
    for (const account of accounts) {
      const label = new TextDecoder().decode(account.account.data.subarray(96)).replace(/\0/g, '').trim();
      const subdomain = /^[a-z0-9-]+$/.test(label) ? `${label}.${SNS_PARENT_DOMAIN}` : null;
      if (subdomain && getDomainKeySync(subdomain).pubkey.equals(account.pubkey)) return Response.json({ found: true, registryAddress: account.pubkey.toBase58(), subdomain });
    }
    return Response.json(accounts.length ? { found: true, registryAddress: accounts[0].pubkey.toBase58(), subdomain: null } : { found: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}