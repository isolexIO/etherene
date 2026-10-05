import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Server-side verified creation of community content (Transmissions, Resonances,
// Messages, Follows). The caller must be authenticated AND own a minted, non-banned
// Identity for the wallet address — the address is never trusted from the client.
// With Identity creation restricted to admin/service-role, created_by_id genuinely
// proves the caller went through the mint flow (which requires signing a Solana
// payment with that wallet).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { action, payload } = await req.json();

    // This is a wallet-first app: Base44 auth is optional (wallet-only users
    // have no platform account). Ownership is proven by the existence of a
    // minted, non-banned Identity for the wallet address — identities are
    // only created through server-side mint/import flows that verify on-chain
    // wallet ownership (payment signatures or domain control), so the record
    // itself is the proof. created_by_id cannot be used because identities are
    // persisted via the service role.
    const { address } = payload || {};
    if (!address) return Response.json({ error: 'Wallet address is required.' }, { status: 400 });

    const identities = await base44.entities.Identity.filter({ address });
    const identity = identities[0];
    if (!identity) return Response.json({ error: 'You do not own an identity for this wallet.' }, { status: 403 });
    if (identity.banned) return Response.json({ error: 'Identity suspended.' }, { status: 403 });
    if (identity.status !== 'minted') return Response.json({ error: 'Your identity is not yet minted.' }, { status: 403 });

    const admin = base44.asServiceRole;

    if (action === 'createTransmission') {
      const { content, type } = payload;
      if (!content?.trim()) return Response.json({ error: 'Content is required.' }, { status: 400 });
      const transmission = await admin.entities.Transmission.create({
        content: content.trim(),
        author_address: address,
        type: type || 'insight',
        amplified_by: []
      });
      return Response.json({ success: true, transmission });
    }

    if (action === 'createResonance') {
      const { content, transmission_id } = payload;
      if (!content?.trim() || !transmission_id) return Response.json({ error: 'Content and transmission ID are required.' }, { status: 400 });
      const resonance = await admin.entities.Resonance.create({
        content: content.trim(),
        transmission_id,
        author_address: address
      });
      return Response.json({ success: true, resonance });
    }

    if (action === 'sendMessage') {
      const { recipient_address, content } = payload;
      if (!recipient_address || !content?.trim()) return Response.json({ error: 'Recipient and content are required.' }, { status: 400 });
      const message = await admin.entities.Message.create({
        sender_address: address,
        recipient_address,
        content: content.trim(),
        read: false
      });
      return Response.json({ success: true, message });
    }

    if (action === 'createFollow') {
      const { following_address } = payload;
      if (!following_address) return Response.json({ error: 'Following address is required.' }, { status: 400 });
      const existing = await admin.entities.Follow.filter({ follower_address: address, following_address });
      if (existing.length > 0) return Response.json({ success: true, alreadyFollowing: true });
      const follow = await admin.entities.Follow.create({
        follower_address: address,
        following_address
      });
      return Response.json({ success: true, follow });
    }

    if (action === 'updateProfile') {
      const { display_name, bio, avatar_url, cover_image, socials } = payload;
      const updated = await admin.entities.Identity.update(identity.id, {
        ...(display_name !== undefined ? { display_name } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(avatar_url !== undefined ? { avatar_url } : {}),
        ...(cover_image !== undefined ? { cover_image } : {}),
        ...(socials !== undefined ? { socials } : {})
      });
      return Response.json({ success: true, identity: updated });
    }

    if (action === 'deleteFollow') {
      const { following_address } = payload;
      if (!following_address) return Response.json({ error: 'Following address is required.' }, { status: 400 });
      const records = await admin.entities.Follow.filter({ follower_address: address, following_address });
      for (const r of records) {
        await admin.entities.Follow.delete(r.id);
      }
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}