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

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

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

    // 1. Record the private quest badge. User-scoped write sets created_by_id to
    //    the caller, matching the owner-scoped RLS on QuestProgress.
    const progress = await base44.entities.QuestProgress.create({
      address,
      date,
      quest_key,
      completed: true,
    });

    // 2. Broadcast a public Transmission only if the caller owns an Identity for
    //    this wallet address — prevents impersonating another node in the Agora.
    let transmission_id = null;
    const identities = await base44.entities.Identity.filter({ address });
    const ownsAddress = Array.isArray(identities) && identities.some(
      (id) => id && id.created_by_id === user.id
    );
    if (ownsAddress) {
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