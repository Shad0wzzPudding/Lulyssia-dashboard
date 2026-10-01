import { createClient } from 'jsr:@supabase/supabase-js@2';

const LINE_API = 'https://api.line.me/v2/bot';
const TH_OFFSET_MS = 7 * 60 * 60 * 1000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

function thTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const shifted = new Date(d.getTime() + TH_OFFSET_MS);
  return `${String(shifted.getUTCHours()).padStart(2, '0')}:${String(shifted.getUTCMinutes()).padStart(2, '0')}`;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/==(.*?)==/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .trim();
}

function formatDetail(text: string | null): string | null {
  if (!text) return null;
  const clean = stripMarkdown(text).trim();
  if (!clean) return null;
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  if (lines.length <= 5) return lines.join('\n');
  return [...lines.slice(0, 5), '...'].join('\n');
}

type LineMessage =
  | { type: 'text'; text: string }
  | { type: 'image'; originalContentUrl: string; previewImageUrl: string };

async function pushMessages(token: string, to: string, messages: LineMessage[]) {
  const res = await fetch(`${LINE_API}/message/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to, messages: messages.slice(0, 5) }),
  });
  if (!res.ok) throw new Error(`LINE push failed ${res.status}: ${await res.text()}`);
}

// Signed https URLs for image attachments LINE can fetch (JPEG/PNG only).
async function imageMessages(
  supabase: ReturnType<typeof createClient>,
  attachments: unknown,
): Promise<LineMessage[]> {
  const list = Array.isArray(attachments) ? attachments : [];
  const images = list.filter(
    (a: Record<string, unknown>) =>
      typeof a?.type === 'string' && /^image\/(jpeg|jpg|png)$/i.test(a.type as string) && typeof a?.path === 'string',
  );
  const out: LineMessage[] = [];
  for (const img of images) {
    const { data } = await supabase.storage
      .from('attachments')
      .createSignedUrl(img.path as string, 60 * 60 * 24);
    if (data?.signedUrl) {
      out.push({ type: 'image', originalContentUrl: data.signedUrl, previewImageUrl: data.signedUrl });
    }
  }
  return out;
}

const NUDGES = [
  "Past due, but not past hope! Let's knock it out~ 📸",
  'This one slipped by — want to finish it now?',
  "Deadline's gone, but it's still waiting for you!",
  'Late is better than never. You got this!',
];

function thDateTime(iso: string): string {
  const s = new Date(new Date(iso).getTime() + TH_OFFSET_MS);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(s.getUTCDate())}/${p(s.getUTCMonth() + 1)} ${p(s.getUTCHours())}:${p(s.getUTCMinutes())}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const accessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    if (!accessToken) return json({ error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' }, 500);
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const cronSecret = req.headers.get('x-cron-secret');
    const validSecrets = [Deno.env.get('CRON_SECRET'), Deno.env.get('LINE_CRON_SECRET')].filter(Boolean);
    if (!cronSecret || !validSecrets.includes(cronSecret)) return json({ error: 'Unauthorized' }, 401);

    const { data: links, error } = await supabase
      .from('line_links')
      .select('user_id, line_user_id')
      .not('line_user_id', 'is', null)
      .eq('overdue_enabled', true);
    if (error) throw error;

    const now = new Date();
    const floor = new Date(now.getTime() - 3 * 86400000); // only deadlines missed in the last 3 days
    let sent = 0;
    const failures: string[] = [];

    for (const link of links ?? []) {
      try {
        const { data: tasks } = await supabase
          .from('tasks').select('id, title, description, deadline, tag_ids')
          .eq('user_id', link.user_id).eq('is_completed', false).is('recurrence_unit', null)
          .lt('deadline', now.toISOString()).gte('deadline', floor.toISOString());
        const { data: tags } = await supabase.from('tags').select('id, name').eq('user_id', link.user_id);
        const tagMap = new Map((tags ?? []).map((t) => [t.id, t.name]));

        for (const t of tasks ?? []) {
          const { error: markErr } = await supabase.from('line_reminders_sent').insert({
            user_id: link.user_id, item_type: 'task_overdue', item_id: t.id, occurrence_at: t.deadline,
          });
          if (markErr) continue;
          const tagNames = (t.tag_ids ?? []).map((id: string) => tagMap.get(id)).filter(Boolean).join(', ') || '-';
          const text = [
            '⚠️ Missed deadline!', '', '📋 Task',
            `Name : ${t.title}`, 'Detail :', formatDetail(t.description) ?? '-',
            `Deadline was : ${thDateTime(t.deadline)}`, `Tag : ${tagNames}`, '',
            `"${NUDGES[Math.floor(Math.random() * NUDGES.length)]}"`,
          ].join('\n');
          await pushMessages(accessToken, link.line_user_id as string, [{ type: 'text', text: text.slice(0, 4900) }]);
          sent++;
        }
      } catch (err) {
        console.error(`Overdue nudge failed for ${link.user_id}:`, err);
        failures.push(String(err));
      }
    }
    return json({ message: 'Overdue nudges processed', sent, failures });
  } catch (error) {
    console.error('send-line-overdue error:', error);
    return json({ error: (error as Error).message }, 500);
  }
});
