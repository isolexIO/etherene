import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data } = body;

    // Only handle create events
    if (event?.type !== 'create' || !data?.id) {
      return Response.json({ ok: true });
    }

    // Re-read the Follow record from the database to verify the event is genuine
    // and derive addresses from the stored record — never trust the caller payload.
    const follows = await base44.asServiceRole.entities.Follow.filter({ id: data.id });
    const follow = follows[0];
    if (!follow) return Response.json({ ok: true });

    const { follower_address, following_address } = follow;
    if (!follower_address || !following_address) {
      return Response.json({ ok: true });
    }

    // Check recipient's notification preferences
    const prefs = await base44.asServiceRole.entities.NotificationPrefs.filter({ address: following_address });
    const pref = prefs[0];
    if (pref && pref.new_follower === false) {
      return Response.json({ ok: true, skipped: 'preference_off' });
    }

    // Idempotency — skip if a notification already exists for this follow record.
    const existingFollowNotif = await base44.asServiceRole.entities.Notification.filter({
      source_id: data.id,
      type: 'new_follower'
    });
    if (existingFollowNotif.length > 0) return Response.json({ ok: true, skipped: 'duplicate' });

    // Create notification
    await base44.asServiceRole.entities.Notification.create({
      recipient_address: following_address,
      type: 'new_follower',
      actor_address: follower_address,
      source_id: data.id,
      read: false
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}