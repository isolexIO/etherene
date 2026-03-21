import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data } = body;

    if (event?.type !== 'create' || !data) {
      return Response.json({ ok: true });
    }

    const { author_address, content } = data;
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

      await base44.asServiceRole.entities.Notification.create({
        recipient_address,
        type: 'following_transmission',
        actor_address: author_address,
        transmission_id: data.id,
        transmission_preview: (content || '').slice(0, 100),
        read: false
      });
    }));

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});