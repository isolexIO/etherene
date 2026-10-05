import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Records a daily-quest completion on behalf of the authenticated caller.
// The private QuestProgress badge is owner-RLS scoped (only the caller can read
// it), so it carries no impersonation risk and is recorded for any connected
// wallet. The public Agora Transmission is only broadcast when the caller
// actually owns an Identity for that wallet address, so a user cannot post
// under another node's address.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    let body = {};
    try {
      body = await req.json();
    } catch (_e) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { address, date, quest_key, title, concept } = body || {};
    if (!address || !date || !quest_key) {
      return Response.json(
        { error: 'Missing required fields: address, date, quest_key' },
        { status: 400 }
      );
    }

    // Verify the caller actually owns an Identity for this wallet address.
    // Without this, any caller could broadcast public posts or fabricate quest
    // badges under another member's address. We bind to the authenticated
    // platform user's own Identity (created_by_id match) — anonymous callers
    // cannot prove ownership and are rejected.
    let callerUserId = null;
    try { const me = await base44.auth.me(); callerUserId = me?.id || null; } catch { /* anonymous */ }
    const identities = await base44.entities.Identity.filter({ address });
    const ownsAddress = Boolean(callerUserId) && Array.isArray(identities) && identities.some(i => i.created_by_id === callerUserId);
    if (!ownsAddress) {
      return Response.json({ error: 'You must own an identity for this wallet to record quest completions.' }, { status: 403 });
    }

    // 1. Record the quest badge.
    const progress = await base44.entities.QuestProgress.create({
      address,
      date,
      quest_key,
      completed: true,
    });

    // 2. Broadcast a public Transmission — ownership already verified above.
    let transmission_id = null;
    try {
      const transmission = await base44.entities.Transmission.create({
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
      progress_id: progress && progress.id,
      transmission_id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}