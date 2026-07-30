import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Records a daily-quest completion with service-role access so the write
// succeeds regardless of the calling app user's per-entity RLS state.
// Creates the private QuestProgress badge (profile / streak) and broadcasts a
// public Transmission that surfaces in the Agora and the Block Explorer.
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

    const admin = base44.asServiceRole;

    // 1. Record the verifiable badge (private to the user's profile / streak).
    const progress = await admin.entities.QuestProgress.create({
      address,
      date,
      quest_key,
      completed: true,
    });

    // 2. Broadcast the achievement as a Transmission so it surfaces as a post
    //    in the Agora and as a transaction in the Block Explorer.
    let transmission = null;
    try {
      transmission = await admin.entities.Transmission.create({
        content: `⚔️ Daily quest complete: "${title}". Earned the ${concept} badge on the Etherene network.`,
        author_address: address,
        type: 'insight',
      });
    } catch (postErr) {
      console.error('Quest broadcast post failed', String(postErr));
    }

    return Response.json({ ok: true, progress_id: progress?.id, transmission_id: transmission?.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}