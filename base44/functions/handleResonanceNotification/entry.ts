import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data } = body;

    if (event?.type !== 'create' || !data) {
      return Response.json({ ok: true });
    }

    const { transmission_id, author_address, content } = data;
    if (!transmission_id || !author_address) {
      return Response.json({ ok: true });
    }

    // Fetch the original transmission to get its author
    const transmissions = await base44.asServiceRole.entities.Transmission.filter({ id: transmission_id });
    const transmission = transmissions[0];
    if (!transmission) return Response.json({ ok: true });

    const recipient_address = transmission.author_address;

    // Don't notify self
    if (recipient_address === author_address) return Response.json({ ok: true });

    // Check prefs
    const prefs = await base44.asServiceRole.entities.NotificationPrefs.filter({ address: recipient_address });
    const pref = prefs[0];
    if (pref && pref.new_reply === false) {
      return Response.json({ ok: true, skipped: 'preference_off' });
    }

    await base44.asServiceRole.entities.Notification.create({
      recipient_address,
      type: 'new_reply',
      actor_address: author_address,
      transmission_id,
      transmission_preview: (content || '').slice(0, 100),
      read: false
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});