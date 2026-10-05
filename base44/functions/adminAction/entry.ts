import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Server-side admin authorization for privileged mutations (ban toggles,
// mint-status updates). Replaces the client-only wallet comparison in
// Admin.jsx — the caller must be authenticated AND either own the Identity
// record for the configured admin_wallet or hold the Base44 admin role.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { action, payload } = await req.json();

    // Require authentication.
    let caller = null;
    try { caller = await base44.auth.me(); } catch { /* anonymous */ }
    if (!caller) return Response.json({ error: 'Authentication required.' }, { status: 401 });

    // Verify admin status server-side.
    const settings = (await base44.entities.GlobalSettings.list())[0];
    if (!settings?.admin_wallet) return Response.json({ error: 'Admin wallet not configured.' }, { status: 500 });

    const adminIdentities = await base44.entities.Identity.filter({ address: settings.admin_wallet });
    const ownsAdminWallet = adminIdentities.some(i => i.created_by_id === caller.id);
    const isBase44Admin = caller.role === 'admin';

    if (!ownsAdminWallet && !isBase44Admin) {
      return Response.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const admin = base44.asServiceRole;

    if (action === 'toggleBan') {
      const { identityId, banned } = payload || {};
      if (!identityId) return Response.json({ error: 'Identity ID required.' }, { status: 400 });
      const identity = await admin.entities.Identity.update(identityId, { banned });
      return Response.json({ success: true, identity });
    }

    if (action === 'updateMintStatus') {
      const { requestId, status } = payload || {};
      if (!requestId || !status) return Response.json({ error: 'Request ID and status required.' }, { status: 400 });
      if (status === 'minted') {
        const request = await admin.entities.MintRequest.get(requestId);
        const verifyRes = await base44.functions.invoke('verifyIdentity', { domain: request.subdomain, userAddress: request.user_address });
        if (!verifyRes.data?.success) throw new Error(verifyRes.data?.error || 'Mint is not confirmed on-chain.');
        const identities = await admin.entities.Identity.filter({ address: request.user_address });
        if (identities[0]) {
          await admin.entities.Identity.update(identities[0].id, { status: 'minted', subdomain: request.subdomain, network: 'Solana Mainnet' });
        }
      }
      const request = await admin.entities.MintRequest.update(requestId, { status });
      return Response.json({ success: true, request });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}