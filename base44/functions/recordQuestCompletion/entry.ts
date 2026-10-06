import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { PublicKey } from 'npm:@solana/web3.js@1.98.4';
import nacl from 'npm:tweetnacl@1.0.3';

// Records a daily-quest completion on behalf of a wallet owner.
//
// Verification is "action verified": the caller must produce a wallet signature
// over a server-constructed challenge (quest key + date + timestamp), proving
// they control the private key for the wallet address. The backend additionally
// requires a minted, non-banned Identity to exist for that address — identities
// are only created through server-side mint/import flows that verify on-chain
// wallet ownership, so the record itself is the identity proof. This mirrors
// the communityAction pattern and does NOT rely on created_by_id (identities are
// persisted via the service role, so created_by_id never matches the wallet user).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    let body = {};
    try {
      body = await req.json();
    } catch (_e) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { address, date, quest_key, title, concept, timestamp, signature } = body || {};
    if (!address || !date || !quest_key) {
      return Response.json(
        { error: 'Missing required fields: address, date, quest_key' },
        { status: 400 }
      );
    }
    if (typeof signature !== 'string' || !signature) {
      return Response.json(
        { error: 'Wallet signature is required to verify this action.' },
        { status: 400 }
      );
    }

    // ── 1. Verify the wallet signature (action verified) ────────────────────
    // The challenge binds the signature to this specific quest on this specific
    // date, with a fresh timestamp to prevent replay.
    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
      return Response.json({ error: 'Proof has expired. Please try again.' }, { status: 400 });
    }
    const expectedMessage = `etherene:quest:${quest_key}:${date}:${ts}`;
    const messageBytes = new TextEncoder().encode(expectedMessage);
    let signatureBytes;
    try { signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0)); }
    catch { return Response.json({ error: 'Invalid signature encoding.' }, { status: 400 }); }
    let isValid = false;
    try { isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, new PublicKey(address).toBytes()); }
    catch { /* malformed signature — leave isValid false */ }
    if (!isValid) {
      return Response.json(
        { error: 'Wallet signature verification failed. Please reconnect your wallet and try again.' },
        { status: 403 }
      );
    }

    // ── 2. Verify a minted identity exists for this wallet ──────────────────
    const identities = await base44.entities.Identity.filter({ address });
    const identity = identities[0];
    if (!identity) {
      return Response.json({ error: 'You must own a minted identity for this wallet to record quest completions.' }, { status: 403 });
    }
    if (identity.banned) {
      return Response.json({ error: 'Identity suspended.' }, { status: 403 });
    }
    if (identity.status !== 'minted') {
      return Response.json({ error: 'Your identity is not yet minted.' }, { status: 403 });
    }

    // ── 3. Record the quest badge ───────────────────────────────────────────
    const admin = base44.asServiceRole;
    const progress = await admin.entities.QuestProgress.create({
      address,
      date,
      quest_key,
      completed: true,
    });

    // ── 4. Broadcast a public Transmission ──────────────────────────────────
    let transmission_id = null;
    try {
      const transmission = await admin.entities.Transmission.create({
        content: `⚔️ Daily quest complete: "${title}". Earned the ${concept} badge on the Etherene network.`,
        author_address: address,
        type: 'insight',
      });
      transmission_id = transmission && transmission.id;
    } catch (postErr) {
      console.error('Quest broadcast post failed', String(postErr));
    }

    return Response.json({
      ok: true,
      verified: true,
      progress_id: progress && progress.id,
      transmission_id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}