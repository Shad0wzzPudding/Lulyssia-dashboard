import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const LINE_API = 'https://api.line.me/v2/bot';
const TH_OFFSET_MS = 7 * 60 * 60 * 1000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

function thDateString(d: Date): string {
  return new Date(d.getTime() + TH_OFFSET_MS).toISOString().split('T')[0];
}

function thTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const shifted = new Date(d.getTime() + TH_OFFSET_MS);
  const hh = String(shifted.getUTCHours()).padStart(2, '0');
  const mm = String(shifted.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

// The dashboard editor stores literal * and ~ escaped as \* and \~. Keep those as
// plain characters (placeholders while stripping), and strip ***bold italic*** too.
const ESC_STAR = '\u0001';
const ESC_TILDE = '\u0002';

function stripMarkdown(text: string): string {
  return text
    .replace(/\\\*/g, ESC_STAR)
    .replace(/\\~/g, ESC_TILDE)
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/==(.*?)==/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .split(ESC_STAR).join('*')
    .split(ESC_TILDE).join('~')
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

type FlexComponent = Record<string, unknown>;
type LineMessage =
  | { type: 'text'; text: string }
  | { type: 'image'; originalContentUrl: string; previewImageUrl: string }
  | { type: 'flex'; altText: string; contents: FlexComponent };

// Lulyssia's sticker art (PNGs up to 832px in the web app's public/line-stickers/), sent as an image
// after the sign-off. Bots can only send LINE's own sticker packs, not a custom set.
const SITE_URL = 'https://personal-dashboard-opal-gamma.vercel.app';
const stickerImage = (name: string): LineMessage => {
  const url = `${SITE_URL}/line-stickers/${name}.png`;
  return { type: 'image', originalContentUrl: url, previewImageUrl: url };
};

// ---- Morning letter card (LINE Flex Message) ----
// Dark card with the "Morning letter" banner (public/line-cards/, drawn from
// art-source/line-cards/banners.html), the day's events and tasks, and an "Open dashboard" button.
const CARD = {
  bg: '#10171C',
  item: '#18232A',
  ink: '#EAF6F9',
  muted: '#A9C3CC',
  detail: '#C9DBE1',
  date: '#8FB3BF',
  neon: '#5EE3F0',
  cyan: '#3AADD0',
  dark: '#04131A',
  chip: '#BFEEF7',
};
// LINE limits one card's layout to about 30 KB; stay well under it
const CARD_MAX_CHARS = 24000;

type CardItem = { title: string; time: string | null; detail: string | null; tags: string; edge: string };

const flexText = (text: string, extra: FlexComponent = {}): FlexComponent => ({ type: 'text', text, wrap: true, ...extra });

/** "🕒 16:00 – 18:00", "🕒 Starts 08:00", "🕒 Due 23:59", or null when the item has no times. */
function timeRange(start: string | null, due: string | null): string | null {
  if (start && due) return `🕒 ${start} – ${due}`;
  if (start) return `🕒 Starts ${start}`;
  if (due) return `🕒 Due ${due}`;
  return null;
}

/** One event or task: a coloured edge, then its name, time, detail and tags. */
const cardItem = ({ title, time, detail, tags, edge }: CardItem): FlexComponent => ({
  type: 'box',
  layout: 'horizontal',
  backgroundColor: CARD.item,
  cornerRadius: '8px',
  contents: [
    { type: 'box', layout: 'vertical', width: '4px', backgroundColor: edge, contents: [] },
    {
      type: 'box',
      layout: 'vertical',
      flex: 1,
      paddingAll: '10px',
      spacing: 'xs',
      contents: [
        flexText(title, { size: 'md', weight: 'bold', color: CARD.ink }),
        ...(time ? [flexText(time, { size: 'sm', color: CARD.muted })] : []),
        ...(detail ? [flexText(detail, { size: 'sm', color: CARD.detail, maxLines: 5 })] : []),
        ...(tags
          ? [{
              type: 'box',
              layout: 'horizontal',
              contents: [{
                type: 'box',
                layout: 'vertical',
                flex: 0,
                backgroundColor: CARD.chip,
                cornerRadius: '4px',
                paddingStart: '6px',
                paddingEnd: '6px',
                contents: [flexText(`🏷 ${tags}`, { size: 'xs', weight: 'bold', color: CARD.dark })],
              }],
            }]
          : []),
      ],
    },
  ],
});

/** "📅 EVENTS" with its count badge, then the items. */
const cardSection = (label: string, count: number, items: FlexComponent[]): FlexComponent => ({
  type: 'box',
  layout: 'vertical',
  spacing: 'sm',
  contents: [
    {
      type: 'box',
      layout: 'horizontal',
      alignItems: 'center',
      contents: [
        flexText(label, { size: 'sm', weight: 'bold', color: CARD.neon, flex: 1 }),
        {
          type: 'box',
          layout: 'vertical',
          flex: 0,
          backgroundColor: CARD.neon,
          cornerRadius: 'xxl',
          paddingStart: '8px',
          paddingEnd: '8px',
          contents: [flexText(String(count), { size: 'xs', weight: 'bold', color: CARD.dark, align: 'center' })],
        },
      ],
    },
    ...items,
  ],
});

/** The whole morning letter card. Drops items from the end (with a "+N more" line) if it gets too big. */
function morningLetterCard(opts: { name: string; date: string; events: CardItem[]; tasks: CardItem[] }): LineMessage {
  const { name, date, events, tasks } = opts;
  const total = events.length + tasks.length;
  const build = (keep: number): FlexComponent => {
    const shownEvents = events.slice(0, keep);
    const shownTasks = tasks.slice(0, Math.max(0, keep - shownEvents.length));
    const hidden = total - shownEvents.length - shownTasks.length;
    const body: FlexComponent[] = [
      flexText(`${date} · Thai time`, { size: 'xs', color: CARD.date }),
      flexText(`🦋 Dear ${name}, good morning!`, { size: 'md', weight: 'bold', color: CARD.ink }),
    ];
    if (total === 0) {
      body.push(flexText('Your day is clear — no tasks and no events. Please enjoy it.', { size: 'sm', color: CARD.detail }));
    }
    if (events.length > 0) body.push(cardSection('📅 EVENTS', events.length, shownEvents.map(cardItem)));
    if (events.length > 0 && tasks.length > 0) body.push({ type: 'separator', color: '#24323A' });
    if (tasks.length > 0) body.push(cardSection('📋 TASKS', tasks.length, shownTasks.map(cardItem)));
    if (hidden > 0) {
      body.push(flexText(`+${hidden} more in the dashboard`, { size: 'sm', weight: 'bold', color: CARD.neon }));
    }
    return {
      type: 'bubble',
      size: 'mega',
      hero: {
        type: 'image',
        url: `${SITE_URL}/line-cards/morning-letter.png`,
        size: 'full',
        aspectRatio: '26:10',
        aspectMode: 'cover',
        action: { type: 'uri', uri: SITE_URL },
      },
      body: { type: 'box', layout: 'vertical', backgroundColor: CARD.bg, paddingAll: '14px', spacing: 'md', contents: body },
      footer: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: CARD.bg,
        paddingAll: '14px',
        paddingTop: '0px',
        contents: [{ type: 'button', style: 'primary', color: CARD.cyan, height: 'sm', action: { type: 'uri', label: 'Open dashboard', uri: SITE_URL } }],
      },
    };
  };
  let keep = total;
  let contents = build(keep);
  while (keep > 0 && JSON.stringify(contents).length > CARD_MAX_CHARS) {
    keep -= 1;
    contents = build(keep);
  }
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const altText = total === 0
    ? 'Morning letter: your day is clear'
    : `Morning letter: ${plural(events.length, 'event')}, ${plural(tasks.length, 'task')}`;
  return { type: 'flex', altText, contents };
}

/** "Sun 11 Oct 2026" from a YYYY-MM-DD date. */
function cardDate(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  return isNaN(d.getTime())
    ? ymd
    : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

async function pushMessages(token: string, to: string, messages: LineMessage[]) {
  const res = await fetch(`${LINE_API}/message/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to, messages: messages.slice(0, 5) }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LINE push failed ${res.status}: ${body}`);
  }
}

async function pushMessage(token: string, to: string, text: string) {
  await pushMessages(token, to, [{ type: 'text', text: text.slice(0, 4900) }]);
}

// Signed https URLs for image attachments LINE can fetch (JPEG/PNG only).
async function imageMessages(
  supabase: SupabaseClient,
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

    // Auth: either the cron secret, or a signed-in user asking for a test message
    const cronSecret = req.headers.get('x-cron-secret');
    const validSecrets = [Deno.env.get('CRON_SECRET'), Deno.env.get('LINE_CRON_SECRET')].filter(Boolean);
    const isCron = !!cronSecret && validSecrets.includes(cronSecret);

    let targetUserId: string | null = null;
    if (!isCron) {
      const authHeader = req.headers.get('Authorization') ?? '';
      const token = authHeader.replace('Bearer ', '');
      const { data: userData } = await supabase.auth.getUser(token);
      if (!userData?.user) return json({ error: 'Unauthorized' }, 401);
      targetUserId = userData.user.id;
    } else {
      // Cron may target a single user (e.g. the "Today" button in the LINE menu)
      try {
        const body = await req.json();
        if (body && typeof body.user_id === 'string') targetUserId = body.user_id;
      } catch (_) { /* no body */ }
    }


    // "Daily message" only controls the scheduled 08:00 run; asking for the list
    // (LINE "today" or the Settings test button) always sends it
    let query = supabase
      .from('line_links')
      .select('user_id, line_user_id, display_name')
      .not('line_user_id', 'is', null);
    query = targetUserId ? query.eq('user_id', targetUserId) : query.eq('is_enabled', true);

    const { data: links, error: linksError } = await query;
    if (linksError) throw linksError;
    if (!links || links.length === 0) return json({ message: 'No linked LINE accounts', sent: 0 });

    // Nicknames set in the dashboard Settings
    const { data: nameRows } = await supabase
      .from('user_preferences')
      .select('user_id, nickname')
      .in('user_id', links.map((l) => l.user_id));
    const nameByUser = new Map((nameRows ?? []).map((r) => [r.user_id, r.nickname || null]));

    const today = thDateString(new Date());
    let sent = 0;
    const failures: string[] = [];

    for (const link of links) {
      try {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('title, description, deadline, start_date, recurrence_unit, recurrence_interval, tag_ids, attachments, notice_before')
          .eq('user_id', link.user_id)
          .eq('is_completed', false);

        const { data: events } = await supabase
          .from('events')
          .select('title, description, start_time, deadline, tag_ids, attachments, notice_before')
          .eq('user_id', link.user_id);

        const { data: tags } = await supabase
          .from('tags')
          .select('id, name')
          .eq('user_id', link.user_id);

        // Only include items that actually start today OR are due today.
        // Ongoing items (started before today and due after today) are excluded.
        const matchesToday = (from: string | null, to: string | null) => {
          const s = from ? thDateString(new Date(from)) : null;
          const e = to ? thDateString(new Date(to)) : null;
          return s === today || e === today;
        };

        // For recurring tasks, check whether a specific anchor date (start or deadline)
        // recurs on today's date.
        const recurrenceHitsToday = (
          anchorIso: string | null,
          unit: string | null,
          intervalRaw: number | null,
        ) => {
          if (!anchorIso || !unit) return false;
          const interval = Math.max(1, intervalRaw ?? 1);
          const anchor = new Date(new Date(anchorIso).getTime() + TH_OFFSET_MS);
          const now = new Date(new Date().getTime() + TH_OFFSET_MS);
          const anchorDay = Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate());
          const todayDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
          if (todayDay < anchorDay) return false;
          const dayDiff = Math.round((todayDay - anchorDay) / 86400000);
          switch (unit) {
            case 'day':
            case 'days':
              return dayDiff % interval === 0;
            case 'week':
            case 'weeks':
              return dayDiff % (7 * interval) === 0;
            case 'month':
            case 'months': {
              const months =
                (now.getUTCFullYear() - anchor.getUTCFullYear()) * 12 + (now.getUTCMonth() - anchor.getUTCMonth());
              return months >= 0 && months % interval === 0 && now.getUTCDate() === anchor.getUTCDate();
            }
            case 'year':
            case 'years': {
              const years = now.getUTCFullYear() - anchor.getUTCFullYear();
              return (
                years >= 0 &&
                years % interval === 0 &&
                now.getUTCMonth() === anchor.getUTCMonth() &&
                now.getUTCDate() === anchor.getUTCDate()
              );
            }
            default:
              return false;
          }
        };

        const tagMap = new Map((tags ?? []).map((tag) => [tag.id, tag.name]));
        const formatTags = (tagIds: string[] | null) => {
          if (!tagIds || tagIds.length === 0) return '';
          const names = tagIds.map((id) => tagMap.get(id)).filter(Boolean) as string[];
          // Plain names; the 🏷 sits before "Tag :", and the line is left out when there are no tags
          return names.join(', ');
        };

        const todayTasks = (tasks ?? []).filter((t) => {
          if (t.recurrence_unit) {
            return (
              recurrenceHitsToday(t.start_date, t.recurrence_unit, t.recurrence_interval) ||
              recurrenceHitsToday(t.deadline, t.recurrence_unit, t.recurrence_interval)
            );
          }
          return matchesToday(t.start_date, t.deadline);
        });

        const todayEvents = (events ?? []).filter((e) => matchesToday(e.start_time, e.deadline));

        // Sign-off lines, each with the sticker that follows it
        const toasts = [
          { line: 'Have a wonderful day.', sticker: 'coffee' },
          { line: "You've got this.", sticker: 'yes' },
          { line: 'Take it one step at a time.', sticker: 'contemplate' },
          { line: 'Make today count.', sticker: 'polaroid' },
          { line: 'Stay positive and keep going.', sticker: 'restpointing' },
          { line: 'I believe in you.', sticker: 'resting' },
          { line: "Let's get things done today.", sticker: 'objection' },
        ];
        const toast = toasts[Math.floor(Math.random() * toasts.length)];

        // Fall back to the LINE profile name when no name is set in the dashboard
        const name = nameByUser.get(link.user_id) || link.display_name || null;
        const lines: string[] = [`*A mysterious envelope appears out of nowhere*\n🦋 Dear ${name ?? 'friend'}, good morning! ${today} (Thai time)`, ''];

        if (todayTasks.length === 0 && todayEvents.length === 0) {
          lines.push('Your day is clear — no tasks and no events. Please enjoy it.');
        } else {
          if (todayEvents.length > 0) {
            lines.push(`📅 Events (${todayEvents.length})`);
            for (const e of todayEvents) {
              const start = thTime(e.start_time);
              const due = thTime(e.deadline);
              const tagStr = formatTags(e.tag_ids);
              const detail = formatDetail(e.description);
              lines.push(`Name : ${e.title}`);
              lines.push(`Detail :`);
              lines.push(detail ?? '-');
              lines.push(`Start time - deadline: ${start ?? '-'} - ${due ?? '-'}`);
              if (tagStr) lines.push(`🏷 Tag : ${tagStr}`);
              lines.push('');
            }
          }
          if (todayTasks.length > 0) {
            lines.push(`📋 Tasks (${todayTasks.length})`);
            for (const t of todayTasks) {
              const start = thTime(t.start_date);
              const due = thTime(t.deadline);
              const tagStr = formatTags(t.tag_ids);
              const detail = formatDetail(t.description);
              lines.push(`Name : ${t.title}`);
              lines.push(`Detail :`);
              lines.push(detail ?? '-');
              lines.push(`Start time - deadline: ${start ?? '-'} - ${due ?? '-'}`);
              if (tagStr) lines.push(`🏷 Tag : ${tagStr}`);
              lines.push('');
            }
          }
        }

        // The morning letter card; the plain text above stays as its fallback
        const letterCard = morningLetterCard({
          name: name ?? 'friend',
          date: cardDate(today),
          events: todayEvents.map((e) => ({
            title: e.title,
            time: timeRange(thTime(e.start_time), thTime(e.deadline)),
            detail: formatDetail(e.description),
            tags: formatTags(e.tag_ids),
            edge: CARD.cyan,
          })),
          tasks: todayTasks.map((t) => ({
            title: t.title,
            time: timeRange(thTime(t.start_date), thTime(t.deadline)),
            detail: formatDetail(t.description),
            tags: formatTags(t.tag_ids),
            edge: '#FFFFFF',
          })),
        });

        // Sign-off text + its sticker: always the last two bubbles of the run, together
        const signOff: LineMessage[] = [
          { type: 'text', text: `"${toast.line}"\nFrom Lulyssia Swiftshade🦋` },
          stickerImage(toast.sticker),
        ];

        const images: LineMessage[] = [];
        for (const item of [...todayEvents, ...todayTasks]) {
          if (images.length >= 4) break;
          images.push(...(await imageMessages(supabase, (item as Record<string, unknown>).attachments)));
        }

        const digest: LineMessage[] = [letterCard, ...images.slice(0, 4)];
        // If LINE ever rejects the card, the same push goes again with the plain-text letter
        const digestText: LineMessage = { type: 'text', text: lines.join('\n').trim().slice(0, 4900) };
        const pushDigest = async (messages: LineMessage[]) => {
          try {
            await pushMessages(accessToken, link.line_user_id as string, messages);
          } catch (err) {
            console.error(`Morning letter card rejected for user ${link.user_id}, sending text instead:`, err);
            await pushMessages(accessToken, link.line_user_id as string, messages.map((m) => (m === letterCard ? digestText : m)));
          }
        };

        // Separate "Notice before" message: items flagged to warn one day ahead.
        const tomorrow = thDateString(new Date(Date.now() + 86400000));
        const isTomorrow = (iso: string | null) => !!iso && thDateString(new Date(iso)) === tomorrow;
        const noticeItems = [
          ...(events ?? [])
            .filter((e) => e.notice_before && (isTomorrow(e.start_time) || isTomorrow(e.deadline)))
            .map((e) => ({ kind: '📅 Event', title: e.title, description: e.description, start: e.start_time, deadline: e.deadline, tag_ids: e.tag_ids })),
          ...(tasks ?? [])
            .filter((t) => t.notice_before && !t.recurrence_unit && (isTomorrow(t.start_date) || isTomorrow(t.deadline)))
            .map((t) => ({ kind: '📋 Task', title: t.title, description: t.description, start: t.start_date, deadline: t.deadline, tag_ids: t.tag_ids })),
        ];
        // LINE counts each push as one message (up to 5 bubbles), so the sign-off and sticker
        // join the last push when there is room instead of costing an extra push
        const signOffFits = digest.length + signOff.length <= 5;
        if (noticeItems.length === 0 && signOffFits) {
          await pushDigest([...digest, ...signOff]);
        } else {
          await pushDigest(digest);
        }
        sent++;

        if (noticeItems.length > 0) {
          const n: string[] = [`🔔 Notice before — coming up tomorrow (${tomorrow})`, ''];
          for (const it of noticeItems) {
            const startStr = isTomorrow(it.start) ? thTime(it.start) : null;
            const dueStr = isTomorrow(it.deadline) ? thTime(it.deadline) : null;
            n.push(it.kind);
            n.push(`Name : ${it.title}`);
            n.push('Detail :');
            n.push(formatDetail(it.description) ?? '-');
            n.push(`Start time - deadline: ${startStr ?? '-'} - ${dueStr ?? '-'}`);
            const tagStr = formatTags(it.tag_ids);
            if (tagStr) n.push(`🏷 Tag : ${tagStr}`);
            n.push('');
          }
  
          await pushMessages(accessToken, link.line_user_id as string, [
            { type: 'text', text: n.join('\n').trim().slice(0, 4900) },
            ...signOff,
          ]);
        } else if (!signOffFits) {
          // Digest had no room left (text + 3 or 4 images): the sign-off and sticker get their own push
          await pushMessages(accessToken, link.line_user_id as string, signOff);
        }
      } catch (err) {
        console.error(`Failed for user ${link.user_id}:`, err);
        failures.push(String(err));
      }
    }

    return json({ message: 'Daily LINE digest processed', sent, failures });
  } catch (error) {
    console.error('send-line-daily error:', error);
    return json({ error: (error as Error).message }, 500);
  }
});
