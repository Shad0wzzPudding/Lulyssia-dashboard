import { createClient } from 'jsr:@supabase/supabase-js@2';

// Deletes stored attachment files that nothing uses anymore (see the
// unused_attachment_paths SQL function). Send { "dry_run": true } to only list them.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

// Storage removes at most this many files per call
const BATCH = 100;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const cronSecret = req.headers.get('x-cron-secret');
    const validSecrets = [Deno.env.get('CRON_SECRET'), Deno.env.get('LINE_CRON_SECRET')].filter(Boolean);
    if (!cronSecret || !validSecrets.includes(cronSecret)) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dry_run === true;

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data, error } = await supabase.rpc('unused_attachment_paths');
    if (error) throw error;
    const paths = (data ?? []) as string[];

    if (dryRun) return json({ message: 'Dry run: nothing deleted', count: paths.length, paths });

    let deleted = 0;
    const failures: string[] = [];
    for (let i = 0; i < paths.length; i += BATCH) {
      const chunk = paths.slice(i, i + BATCH);
      const { data: removed, error: removeErr } = await supabase.storage.from('attachments').remove(chunk);
      if (removeErr) {
        console.error('Attachment cleanup batch failed:', removeErr);
        failures.push(removeErr.message);
        continue;
      }
      deleted += removed?.length ?? 0;
    }
    return json({ message: 'Unused attachments cleaned up', deleted, failures });
  } catch (error) {
    console.error('cleanup-attachments error:', error);
    return json({ error: (error as Error).message }, 500);
  }
});
