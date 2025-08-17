// @ts-nocheck
// Supabase Edge Function: delete-account
// Expects SUPABASE_SERVICE_ROLE_KEY in function secrets

// Local-safe serve wrapper (Supabase runtime provides serve)
const serve: (handler: (req: Request) => Response | Promise<Response>) => void = (globalThis as any).serve ?? function (_handler) {};

serve(async (req: Request) => {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Service not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const accessToken = authHeader.split(' ')[1];

    // Verify token and get user info via Supabase auth (client-side endpoint)
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userRes.ok) {
      const txt = await userRes.text();
      return new Response(JSON.stringify({ error: 'Invalid session', details: txt }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const userJson = await userRes.json();
    const userId = userJson?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Could not resolve user id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Call Supabase Admin API to delete the user using service role key
    const delRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    if (!delRes.ok) {
      const txt = await delRes.text();
      return new Response(JSON.stringify({ error: 'Failed to delete user', details: txt }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('delete-account function error', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
