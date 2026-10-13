import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getLineQuota } from '../_shared/lineQuota.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// The bot's public LINE id and name (for Settings' "Open LINE" button), plus, for a signed-in
// caller, this month's message usage (the Settings LINE card shows it)
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const accessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
  if (!accessToken) return json({ error: 'LINE not configured' }, 500);

  const res = await fetch('https://api.line.me/v2/bot/info', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return json({ error: `LINE API error ${res.status}` }, 502);
  const info = await res.json();

  // Usage only for someone signed in to the dashboard
  let quota = null;
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  if (token) {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: userData } = await supabase.auth.getUser(token);
    if (userData?.user) quota = await getLineQuota(accessToken);
  }

  return json({ basicId: info.basicId ?? null, displayName: info.displayName ?? null, quota });
});
