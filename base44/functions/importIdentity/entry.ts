import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { PublicKey } from 'npm:@solana/web3.js@1.98.4';
import { solanaConnection, snsDomainName, ownedRegistry, saveIdentity } from '../../shared/solanaIdentity.ts';

// Server-side identity import: verifies on-chain domain ownership and creates
// the Identity record with service role (Identity creation is admin-only via
// RLS, so the frontend cannot create it directly).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { domain, userAddress } = await req.json();
    if (typeof domain !== 'string' || !domain.trim() || !userAddress) return Response.json({ error: 'Domain and wallet address required' }, { status: 400 });

    // Require authentication.
    let callerUserId = null;
    try { const me = await base44.auth.me(); callerUserId = me?.id || null; } catch { /* anonymous */ }
    if (!callerUserId) return Response.json({ error: 'Authentication required to import an identity.' }, { status: 401 });

    let address;
    try { address = new PublicKey(userAddress).toBase58(); }
    catch { return Response.json({ error: 'Invalid Solana wallet address' }, { status: 400 }); }

    // If an Identity already exists for this address, reject.
    const existingIdentity = (await base44.entities.Identity.filter({ address }))[0];
    if (existingIdentity) return Response.json({ error: 'This wallet already has an identity.' }, { status: 409 });

    // Verify on-chain domain ownership — the connected wallet must own this domain.
    const name = snsDomainName(domain);
    await ownedRegistry(solanaConnection(), name, address);

    // Create the Identity with service role (bypasses admin-only create RLS).
    const identity = await saveIdentity(base44, address, {
      subdomain: name,
      network: 'Solana Mainnet',
      status: 'minted',
      bio: `Imported Solana identity: ${name}`
    });

    return Response.json({ success: true, subdomain: name, identity });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}