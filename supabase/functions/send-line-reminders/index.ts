import { createClient } from 'jsr:@supabase/supabase-js@2';
import { CARD, flexText, labelRow, lineCard, tagChip, type FlexMessage } from '../_shared/lineCard.ts';
import { formatDetail } from '../_shared/lineText.ts';
import { startRepeatOn } from '../_shared/recurrence.ts';
import { imageMessages } from '../_shared/lineImages.ts';

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

type LineMessage =
  | { type: 'text'; text: string }
  | { type: 'image'; originalContentUrl: string; previewImageUrl: string }
  | FlexMessage;

/** The "Starting soon" card: who it's for and how long, the item, its times, detail and tags. */
function startingSoonCard(opts: {
  name: string | undefined;
  minsLeft: number;
  kind: 'event' | 'task';
  title: string;
  start: string | null;
  deadline: string | null;
  detail: string | null;
  tags: string;
}): FlexMessage {
  const { name, minsLeft, kind, title, start, deadline, detail, tags } = opts;
  const heads = `⏰ ${name ? `Heads up, ${name}! ` : ''}Starting in ${minsLeft} min`;
  return lineCard({
    banner: 'starting-soon',
    altText: `⏰ Starting in ${minsLeft} min: ${title}`,
    button: 'Open in dashboard',
    body: [
      flexText(heads, { size: 'sm', weight: 'bold', color: CARD.neon }),
      flexText(kind === 'event' ? '📅 EVENT' : '📋 TASK', { size: 'xs', weight: 'bold', color: CARD.date }),
      flexText(title, { size: 'xl', weight: 'bold', color: CARD.ink }),
      {
        type: 'box',
        layout: 'vertical',
        spacing: 'xs',
        contents: [
          ...(start ? [labelRow('Starts', start)] : []),
          ...(deadline ? [labelRow('Deadline', deadline)] : []),
        ],
      },
      ...(detail ? [flexText(detail, { size: 'sm', color: CARD.detail, maxLines: 5 })] : []),
      ...(tags ? [tagChip(tags)] : []),
    ],
  });
}

async function pushMessages(token: string, to: string, messages: LineMessage[]) {
  const res = await fetch(`${LINE_API}/message/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to, messages: messages.slice(0, 5) }),
  });
  if (!res.ok) throw new Error(`LINE push failed ${res.status}: ${await res.text()}`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const accessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    if (!accessToken) return json({ error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' }, 500);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const cronSecret = req.headers.get('x-cron-secret');
    const validSecrets = [Deno.env.get('CRON_SECRET'), Deno.env.get('LINE_CRON_SECRET')].filter(Boolean);
    const isCron = !!cronSecret && validSecrets.includes(cronSecret);

    let targetUserId: string | null = null;
    if (!isCron) {
      const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
      const { data: userData } = await supabase.auth.getUser(token);
      if (!userData?.user) return json({ error: 'Unauthorized' }, 401);
      targetUserId = userData.user.id;
    }

    let query = supabase
      .from('line_links')
      .select('user_id, line_user_id, reminders_enabled')
      .not('line_user_id', 'is', null)
      .eq('reminders_enabled', true);
    if (targetUserId) query = query.eq('user_id', targetUserId);

    const { data: links, error: linksError } = await query;
    if (linksError) throw linksError;
    if (!links || links.length === 0) return json({ message: 'No linked LINE accounts', sent: 0 });

    // Nicknames set in the dashboard Settings
    const { data: nameRows } = await supabase
      .from('user_preferences')
      .select('user_id, nickname')
      .in('user_id', links.map((l) => l.user_id));
    const nameByUser = new Map((nameRows ?? []).map((r) => [r.user_id, r.nickname || null]));

    const now = new Date();
    // Runs every 5 minutes. Starting 5 minutes ahead (not 10) means a reminder LINE refused gets
    // one more try on the next run; the mark below keeps normal reminders to one each.
    const windowStart = new Date(now.getTime() + 5 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 16 * 60 * 1000);
    const inWindow = (d: Date | null) => !!d && d >= windowStart && d < windowEnd;

    let sent = 0;
    const failures: string[] = [];

    for (const link of links) {
      try {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title, description, start_date, deadline, recurrence_unit, recurrence_interval, recurrence_anchor, tag_ids, attachments')
          .eq('user_id', link.user_id)
          .eq('is_completed', false)
          // Repeating tasks are worked out below; one-time tasks only if they start in the window
          .or(`recurrence_unit.not.is.null,and(start_date.gte."${windowStart.toISOString()}",start_date.lt."${windowEnd.toISOString()}")`);

        const { data: events } = await supabase
          .from('events')
          .select('id, title, description, start_time, deadline, tag_ids, attachments')
          .eq('user_id', link.user_id)
          .gte('start_time', windowStart.toISOString())
          .lt('start_time', windowEnd.toISOString());

        const { data: tags } = await supabase.from('tags').select('id, name').eq('user_id', link.user_id);
        const tagMap = new Map((tags ?? []).map((t) => [t.id, t.name]));
        const formatTags = (ids: string[] | null) => {
          const names = (ids ?? []).map((id) => tagMap.get(id)).filter(Boolean) as string[];
          return names.join(', ');
        };

        type Due = {
          type: 'task' | 'event';
          id: string;
          title: string;
          description: string | null;
          occurrence: Date;
          deadline: string | null;
          tag_ids: string[] | null;
          attachments?: unknown;
        };
        const due: Due[] = [];

        for (const t of tasks ?? []) {
          let occ: Date | null = null;
          if (t.recurrence_unit) {
            // Just before midnight (Thai time) the window reaches into the next day, so look for
            // the repeat on both days it touches
            occ = [now, windowEnd]
              .map((day) => startRepeatOn(t, day))
              .find(inWindow) ?? null;
          } else if (t.start_date) {
            occ = new Date(t.start_date);
          }
          if (inWindow(occ)) {
            due.push({
              type: 'task',
              id: t.id,
              title: t.title,
              description: t.description,
              occurrence: occ as Date,
              deadline: t.deadline,
              tag_ids: t.tag_ids,
              attachments: (t as Record<string, unknown>).attachments,
            });
          }
        }

        for (const e of events ?? []) {
          const occ = e.start_time ? new Date(e.start_time) : null;
          if (inWindow(occ)) {
            due.push({
              type: 'event',
              id: e.id,
              title: e.title,
              description: e.description,
              occurrence: occ as Date,
              deadline: e.deadline,
              tag_ids: e.tag_ids,
              attachments: (e as Record<string, unknown>).attachments,
            });
          }
        }

        for (const item of due) {
          const occurrenceIso = item.occurrence.toISOString();
          const { error: markErr } = await supabase.from('line_reminders_sent').insert({
            user_id: link.user_id,
            item_type: item.type,
            item_id: item.id,
            occurrence_at: occurrenceIso,
          });
          if (markErr) continue; // already sent (unique violation) or insert failed

          const minsLeft = Math.max(1, Math.round((item.occurrence.getTime() - now.getTime()) / 60000));
          const name = nameByUser.get(link.user_id);
          const tagStr = formatTags(item.tag_ids);
          const lines = [
            `⏰ ${name ? `Heads up, ${name}! ` : ''}Starting in ${minsLeft} min!`,
            '',
            `${item.type === 'event' ? '📅 Event' : '📋 Task'}`,
            `Name : ${item.title}`,
            'Detail :',
            formatDetail(item.description) ?? '-',
            `Start time - deadline: ${thTime(occurrenceIso) ?? '-'} - ${thTime(item.deadline) ?? '-'}`,
            ...(tagStr ? [`🏷 Tag : ${tagStr}`] : []),
          ];

          const card = startingSoonCard({
            name,
            minsLeft,
            kind: item.type,
            title: item.title,
            start: thTime(occurrenceIso),
            deadline: thTime(item.deadline),
            detail: formatDetail(item.description),
            tags: tagStr,
          });
          try {
            const images = (await imageMessages(supabase, item.attachments, link.user_id)).slice(0, 4);
            try {
              await pushMessages(accessToken, link.line_user_id as string, [card, ...images]);
            } catch (err) {
              // If LINE rejects the card, send the same reminder as plain text
              console.error(`Starting-soon card rejected for user ${link.user_id}, sending text instead:`, err);
              await pushMessages(accessToken, link.line_user_id as string, [
                { type: 'text', text: lines.join('\n').trim().slice(0, 4900) },
                ...images,
              ]);
            }
            sent++;
          } catch (err) {
            // Not sent: remove the mark so the next run can try again, and go on with the rest
            console.error(`Reminder failed for user ${link.user_id}, item ${item.id}:`, err);
            failures.push(String(err));
            await supabase
              .from('line_reminders_sent')
              .delete()
              .eq('user_id', link.user_id)
              .eq('item_type', item.type)
              .eq('item_id', item.id)
              .eq('occurrence_at', occurrenceIso);
          }
        }
      } catch (err) {
        console.error(`Reminder failed for user ${link.user_id}:`, err);
        failures.push(String(err));
      }
    }

    return json({ message: 'LINE reminders processed', sent, failures });
  } catch (error) {
    console.error('send-line-reminders error:', error);
    return json({ error: (error as Error).message }, 500);
  }
});
