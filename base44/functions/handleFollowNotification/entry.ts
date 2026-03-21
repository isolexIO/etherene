import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data } = body;

    // Only handle create events
    if (event?.type !== 'create' || !data) {
      return Response.json({ ok: true });
    }

    const { follower_address, following_address } = data;
    if (!follower_address || !following_address) {
      return Response.json({ ok: true });
    }

    // Check recipient's notification preferences
    const prefs = await base44.asServiceRole.entities.NotificationPrefs.filter({ address: following_address });
    const pref = prefs[0];
    if (pref && pref.new_follower === false) {
      return Response.json({ ok: true, skipped: 'preference_off' });
    }

    // Create notification
    await base44.asServiceRole.entities.Notification.create({
      recipient_address: following_address,
      type: 'new_follower',
      actor_address: follower_address,
      read: false
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});