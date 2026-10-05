import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data } = body;

    if (event?.type !== 'create' || !data?.id) {
      return Response.json({ ok: true });
    }

    // Re-read the Transmission record from the database to verify the event is
    // genuine and derive fields from the stored record — never trust the caller.
    const transmissions = await base44.asServiceRole.entities.Transmission.filter({ id: data.id });
    const transmission = transmissions[0];
    if (!transmission) return Response.json({ ok: true });

    const { author_address, content } = transmission;
    if (!author_address) return Response.json({ ok: true });

    // Find all followers of the author
    const follows = await base44.asServiceRole.entities.Follow.filter({ following_address: author_address });
    if (!follows.length) return Response.json({ ok: true });

    // Notify each follower (respecting their prefs)
    await Promise.all(follows.map(async (follow) => {
      const recipient_address = follow.follower_address;
      if (recipient_address === author_address) return;

      const prefs = await base44.asServiceRole.entities.NotificationPrefs.filter({ address: recipient_address });
      const pref = prefs[0];
      if (pref && pref.following_transmission === false) return;

      // Idempotency — skip if a notification already exists for this transmission
      // and recipient.
      const existingTxNotif = await base44.asServiceRole.entities.Notification.filter({
        source_id: data.id,
        type: 'following_transmission',
        recipient_address
      });
      if (existingTxNotif.length > 0) return;

      await base44.asServiceRole.entities.Notification.create({
        recipient_address,
        type: 'following_transmission',
        actor_address: author_address,
        transmission_id: data.id,
        transmission_preview: (content || '').slice(0, 100),
        source_id: data.id,
        read: false
      });
    }));

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}