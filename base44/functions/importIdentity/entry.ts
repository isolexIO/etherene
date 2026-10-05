import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { PublicKey } from 'npm:@solana/web3.js@1.98.4';
import nacl from 'npm:tweetnacl@1.0.3';
import { solanaConnection, snsDomainName, ownedRegistry, saveIdentity } from '../../shared/solanaIdentity.ts';

// Server-side identity import: verifies on-chain domain ownership AND requires
// a wallet signature proving the API caller controls the wallet address, then
// creates the Identity record with service role (Identity creation is admin-only
// via RLS, so the frontend cannot create it directly).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { domain, userAddress, timestamp, signature } = await req.json();
    if (typeof domain !== 'string' || !domain.trim() || !userAddress) return Response.json({ error: 'Domain and wallet address required' }, { status: 400 });
    if (typeof signature !== 'string' || !signature) return Response.json({ error: 'Wallet signature is required to prove wallet ownership.' }, { status: 400 });

    // Require authentication.
    let callerUserId = null;
    try { const me = await base44.auth.me(); callerUserId = me?.id || null; } catch { /* anonymous */ }
    if (!callerUserId) return Response.json({ error: 'Authentication required to import an identity.' }, { status: 401 });

    let address;
    try { address = new PublicKey(userAddress).toBase58(); }
    catch { return Response.json({ error: 'Invalid Solana wallet address' }, { status: 400 }); }

    // Normalize the domain name (throws on invalid input).
    const name = snsDomainName(domain);

    // Verify proof-of-ownership: the caller must produce a wallet signature over
    // a server-constructed challenge containing the domain and a fresh timestamp.
    // This prevents any signed-in user from claiming another wallet's on-chain
    // identity without proving they control the wallet's private key.
    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
      return Response.json({ error: 'Proof has expired. Please try again.' }, { status: 400 });
    }
    const expectedMessage = `etherene:import:${name}:${ts}`;
    const messageBytes = new TextEncoder().encode(expectedMessage);
    let signatureBytes;
    try { signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0)); }
    catch { return Response.json({ error: 'Invalid signature encoding.' }, { status: 400 }); }
    let isValid = false;
    try { isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, new PublicKey(address).toBytes()); }
    catch { /* malformed signature — leave isValid false */ }
    if (!isValid) {
      return Response.json({ error: 'Wallet signature verification failed. Please reconnect your wallet and try again.' }, { status: 403 });
    }

    // If an Identity already exists for this address, reject.
    const existingIdentity = (await base44.entities.Identity.filter({ address }))[0];
    if (existingIdentity) return Response.json({ error: 'This wallet already has an identity.' }, { status: 409 });

    // Verify on-chain domain ownership — the wallet must own this domain on-chain.
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