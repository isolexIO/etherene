import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Records a daily-quest completion on behalf of the authenticated caller.
// Auth is required and the wallet address must belong to an Identity owned by
// the caller, so quest progress and the public Agora broadcast cannot be
// forged under another user's address.
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

    // Verify the caller owns the wallet address they are recording for, by
    // looking up an Identity for that address that was created by this user.
    // This prevents forging quest progress or impersonating another wallet in
    // the public Agora transmission.
    const identities = await base44.entities.Identity.filter({ address });
    const ownsAddress = Array.isArray(identities) && identities.some(
      (id) => id && id.created_by_id === user.id
    );
    if (!ownsAddress) {
      return Response.json(
        { error: 'You can only record quest progress for your own identity.' },
        { status: 403 }
      );
    }

    // User-scoped writes so created_by_id is the authenticated user, matching
    // the owner-scoped RLS on QuestProgress and Transmission.
    const progress = await base44.entities.QuestProgress.create({
      address,
      date,
      quest_key,
      completed: true,
    });

    let transmission = null;
    try {
      transmission = await base44.entities.Transmission.create({
        content: `⚔️ Daily quest complete: "${title}". Earned the ${concept} badge on the Etherene network.`,
        author_address: address,
        type: 'insight',
      });
    } catch (postErr) {
      console.error('Quest broadcast post failed', String(postErr));
    }

    return Response.json({
      ok: true,
      progress_id: progress && progress.id,
      transmission_id: transmission && transmission.id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}