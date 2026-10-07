import { secrets } from 'base44:runtime';

// Reown's project ID is a public browser identifier, not an authentication key.
// Never expose REOWN_APP_SECRET or any other server credential here.
export default async function(req) {
  try {
    if (req.method !== 'POST' && req.method !== 'GET') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
    const projectId = secrets.get('REOWN_PROJECT_ID')?.trim();
    if (!projectId) {
      return Response.json({ error: 'WalletConnect is not configured.' }, { status: 503 });
    }
    return Response.json({ projectId }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  } catch {
    return Response.json({ error: 'WalletConnect configuration is unavailable.' }, { status: 500 });
  }
}