import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { PublicKey } from 'npm:@solana/web3.js@1.98.4';
import { solanaConnection, snsDomainName, ownedRegistry } from '../../shared/solanaIdentity.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    if (!(await base44.auth.me())) return Response.json({ error: 'Authentication required' }, { status: 401 });
    const { domain, userAddress } = await req.json();
    if (typeof domain !== 'string' || !domain.trim() || !userAddress) return Response.json({ error: 'Domain and wallet address required' }, { status: 400 });
    let address;
    try { address = new PublicKey(userAddress).toBase58(); }
    catch { return Response.json({ error: 'Invalid Solana wallet address' }, { status: 400 }); }
    const name = snsDomainName(domain);
    const { pubkey } = await ownedRegistry(solanaConnection(), name, address);
    return Response.json({ success: true, subdomain: name, owner: address, registryAddress: pubkey.toBase58() });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}