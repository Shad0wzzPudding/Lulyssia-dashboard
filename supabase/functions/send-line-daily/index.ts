import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { CARD, CARD_MAX_CHARS, assetUrl, flexText, lineCard, tagChip, timeRange, type FlexComponent, type FlexMessage } from '../_shared/lineCard.ts';
import { MAX_NUDGES_PER_MESSAGE, daysSince, missedDeadlinesMessage, missedDeadlinesText, type MissedTask } from '../_shared/missedDeadline.ts';
import { formatDetail } from '../_shared/lineText.ts';
import { deadlineRepeatOn, startRepeatOn } from '../_shared/recurrence.ts';

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

type LineMessage =
  | { type: 'text'; text: string }
  | { type: 'image'; originalContentUrl: string; previewImageUrl: string }
  | FlexMessage;

// Lulyssia's sticker art (PNGs up to 832px in the web app's public/line-stickers/), sent as an image
// after the sign-off. Bots can only send LINE's own sticker packs, not a custom set.
const stickerImage = (name: string): LineMessage => {
  const url = assetUrl(`line-stickers/${name}.png`);
  return { type: 'image', originalContentUrl: url, previewImageUrl: url };
};

// ---- Morning letter card (LINE Flex Message) ----
// Built from the shared card pieces in ../_shared/lineCard.ts

type CardItem = { title: string; time: string | null; detail: string | null; tags: string; edge: string; overdue?: boolean };

/** One event or task: a coloured edge, then its name, time, detail and tags. An overdue task gets a
    yellow edge and an "⚠️ OVERDUE" chip under its name. */
const cardItem = ({ title, time, detail, tags, edge, overdue }: CardItem): FlexComponent => ({
  type: 'box',
  layout: 'horizontal',
  backgroundColor: CARD.item,
  cornerRadius: '8px',
  contents: [
    { type: 'box', layout: 'vertical', width: '4px', backgroundColor: overdue ? CARD.warn : edge, contents: [] },
    {
      type: 'box',
      layout: 'vertical',
      flex: 1,
      paddingAll: '10px',
      spacing: 'xs',
      contents: [
        flexText(title, { size: 'md', weight: 'bold', color: CARD.ink }),
        ...(overdue
          ? [{
              type: 'box',
              layout: 'horizontal',
              contents: [{
                type: 'box',
                layout: 'vertical',
                flex: 0,
                backgroundColor: CARD.warn,
                cornerRadius: '4px',
                paddingStart: '6px',
                paddingEnd: '6px',
                contents: [flexText('⚠️ OVERDUE', { size: 'xs', weight: 'bold', color: CARD.dark })],
              }],
            }]
          : []),
        ...(time ? [flexText(time, { size: 'sm', color: CARD.muted })] : []),
        ...(detail ? [flexText(detail, { size: 'sm', color: CARD.detail, maxLines: 5 })] : []),
        ...(tags ? [tagChip(tags)] : []),
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
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * A card listing events then tasks under `header` lines (the morning letter and the notice-before
 * card). Drops items from the end (with a "+N more" line) if it gets too big for LINE.
 */
function itemsCard(opts: {
  banner: string;
  aspectRatio?: string;
  altText: string;
  header: FlexComponent[];
  empty?: string;
  events: CardItem[];
  tasks: CardItem[];
}): FlexMessage {
  const { events, tasks } = opts;
  const total = events.length + tasks.length;
  const build = (keep: number): FlexComponent[] => {
    const shownEvents = events.slice(0, keep);
    const shownTasks = tasks.slice(0, Math.max(0, keep - shownEvents.length));
    const hidden = total - shownEvents.length - shownTasks.length;
    const body: FlexComponent[] = [...opts.header];
    if (total === 0 && opts.empty) body.push(flexText(opts.empty, { size: 'sm', color: CARD.detail }));
    if (events.length > 0) body.push(cardSection('📅 EVENTS', events.length, shownEvents.map(cardItem)));
    if (events.length > 0 && tasks.length > 0) body.push({ type: 'separator', color: CARD.line });
    if (tasks.length > 0) body.push(cardSection('📋 TASKS', tasks.length, shownTasks.map(cardItem)));
    if (hidden > 0) {
      body.push(flexText(`+${hidden} more in the dashboard`, { size: 'sm', weight: 'bold', color: CARD.neon }));
    }
    return body;
  };
  const card = (keep: number) =>
    lineCard({ banner: opts.banner, aspectRatio: opts.aspectRatio, altText: opts.altText, body: build(keep), button: 'Open dashboard' });
  let keep = total;
  let message = card(keep);
  while (keep > 0 && JSON.stringify(message.contents).length > CARD_MAX_CHARS) {
    keep -= 1;
    message = card(keep);
  }
  return message;
}

/** The morning letter: today's events and tasks. */
function morningLetterCard(opts: { name: string; date: string; events: CardItem[]; tasks: CardItem[] }): FlexMessage {
  const { name, date, events, tasks } = opts;
  return itemsCard({
    banner: 'morning-letter',
    altText: events.length + tasks.length === 0
      ? 'Morning letter: your day is clear'
      : `Morning letter: ${plural(events.length, 'event')}, ${plural(tasks.length, 'task')}`,
    header: [
      flexText(`${date} · Thai time`, { size: 'xs', color: CARD.date }),
      flexText(`🦋 Dear ${name}, good morning!`, { size: 'md', weight: 'bold', color: CARD.ink }),
    ],
    empty: 'Your day is clear — no tasks and no events. Please enjoy it.',
    events,
    tasks,
  });
}

/** The notice-before card ("calling card" banner): items flagged to warn a day ahead. */
function noticeBeforeCard(opts: { date: string; events: CardItem[]; tasks: CardItem[] }): FlexMessage {
  const { date, events, tasks } = opts;
  return itemsCard({
    banner: 'calling-card',
    aspectRatio: '5:3',
    altText: `🔔 Coming up tomorrow: ${plural(events.length, 'event')}, ${plural(tasks.length, 'task')}`,
    header: [
      flexText('🔔 NOTICE BEFORE', { size: 'xs', weight: 'bold', color: CARD.neon }),
      flexText(`Coming up tomorrow · ${date}`, { size: 'md', weight: 'bold', color: CARD.ink }),
    ],
    events,
    tasks,
  });
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

// Signed https URLs for image attachments LINE can fetch (JPEG/PNG only). Only files in the
// owner's own folder: the stored path is user data, and this signs with full access.
async function imageMessages(
  supabase: SupabaseClient,
  attachments: unknown,
  userId: string,
): Promise<LineMessage[]> {
  const list = Array.isArray(attachments) ? attachments : [];
  const images = list.filter(
    (a: Record<string, unknown>) =>
      typeof a?.type === 'string' && /^image\/(jpeg|jpg|png)$/i.test(a.type as string) &&
      typeof a?.path === 'string' && (a.path as string).startsWith(`${userId}/`) &&
      !(a.path as string).split('/').includes('..'),
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


    // The 08:00 run covers anyone with the letter, the day-before notice or missed-deadline
    // nudges on; each is sent only if its own switch is on. Asking for the list (LINE "today" or
    // the Settings test button) always sends the letter.
    let query = supabase
      .from('line_links')
      .select('user_id, line_user_id, display_name, is_enabled, notice_enabled, overdue_enabled')
      .not('line_user_id', 'is', null);
    query = targetUserId
      ? query.eq('user_id', targetUserId)
      : query.or('is_enabled.eq.true,notice_enabled.eq.true,overdue_enabled.eq.true');

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
          .select('title, description, deadline, start_date, recurrence_unit, recurrence_interval, recurrence_anchor, is_completed, tag_ids, attachments, notice_before')
          .eq('user_id', link.user_id);
        // Ticked tasks are read too: a ticked repeating task can still get the notice for its next round
        const openTasks = (tasks ?? []).filter((t) => !t.is_completed);

        // The morning letter: when it's on, or when asked for
        const sendLetter = !!targetUserId || link.is_enabled;

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

        const tagMap = new Map((tags ?? []).map((tag) => [tag.id, tag.name]));
        const formatTags = (tagIds: string[] | null) => {
          if (!tagIds || tagIds.length === 0) return '';
          const names = tagIds.map((id) => tagMap.get(id)).filter(Boolean) as string[];
          // Plain names; the 🏷 sits before "Tag :", and the line is left out when there are no tags
          return names.join(', ');
        };

        // A one-off task whose deadline has already passed (repeating tasks aren't marked, like the nudges)
        const nowMs = Date.now();
        const isOverdue = (t: { deadline: string | null; recurrence_unit: string | null }) =>
          !t.recurrence_unit && !!t.deadline && new Date(t.deadline).getTime() < nowMs;

        const todayTasks = openTasks.filter((t) => {
          if (t.recurrence_unit) {
            // A round that starts or is due today (counted from the first deadline, like the app)
            const now = new Date();
            return !!startRepeatOn(t, now) || !!deadlineRepeatOn(t, now);
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
              lines.push(`Name : ${t.title}${isOverdue(t) ? ' (overdue)' : ''}`);
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
            overdue: isOverdue(t),
          })),
        });

        // Sign-off text + its sticker: always the last two bubbles of the run, together
        const signOff: LineMessage[] = [
          { type: 'text', text: `"${toast.line}"\nFrom Lulyssia Swiftshade🦋` },
          stickerImage(toast.sticker),
        ];

        const images: LineMessage[] = [];
        for (const item of sendLetter ? [...todayEvents, ...todayTasks] : []) {
          if (images.length >= 4) break;
          images.push(...(await imageMessages(supabase, (item as Record<string, unknown>).attachments, link.user_id)));
        }

        const digest: LineMessage[] = [letterCard, ...images.slice(0, 4)];
        // If LINE ever rejects the card, the same push goes again with the plain-text letter
        const digestText: LineMessage = { type: 'text', text: lines.join('\n').trim().slice(0, 4900) };

        // Separate "Notice before" message (its own switch): items flagged to warn one day ahead.
        const tomorrowDay = new Date(Date.now() + 86400000);
        const tomorrow = thDateString(tomorrowDay);
        const isTomorrow = (iso: string | null) => !!iso && thDateString(new Date(iso)) === tomorrow;
        const noticeItems = !link.notice_enabled ? [] : [
          ...(events ?? [])
            .filter((e) => e.notice_before)
            .map((e) => ({ kind: '📅 Event', title: e.title, description: e.description, start: e.start_time, deadline: e.deadline, tag_ids: e.tag_ids })),
          ...(tasks ?? [])
            .filter((t) => t.notice_before && (t.recurrence_unit || !t.is_completed))
            .map((t) => {
              const item = { kind: '📋 Task', title: t.title, description: t.description, start: t.start_date, deadline: t.deadline, tag_ids: t.tag_ids };
              if (!t.recurrence_unit) return item;
              // A repeating task: its round that starts or is due tomorrow (same rule as the app)
              const start = startRepeatOn(t, tomorrowDay);
              const deadline = deadlineRepeatOn(t, tomorrowDay);
              // Ticked means the current round (the stored deadline) is done; a later round still counts
              const roundDeadline = deadline ?? (start && t.deadline && t.start_date
                ? new Date(start.getTime() + new Date(t.deadline).getTime() - new Date(t.start_date).getTime())
                : null);
              const tickedRound = t.is_completed
                && (!t.deadline || !roundDeadline || roundDeadline.getTime() === new Date(t.deadline).getTime());
              if (tickedRound) return { ...item, start: null, deadline: null };
              return { ...item, start: start?.toISOString() ?? null, deadline: deadline?.toISOString() ?? null };
            }),
        ].filter((it) => isTomorrow(it.start) || isTomorrow(it.deadline));
        // Notice-before card (plain text as its fallback)
        let noticeCard: LineMessage | null = null;
        let noticeText: LineMessage | null = null;
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
          noticeText = { type: 'text', text: n.join('\n').trim().slice(0, 4900) };
          const toItem = (it: (typeof noticeItems)[number]): CardItem => ({
            title: it.title,
            time: timeRange(isTomorrow(it.start) ? thTime(it.start) : null, isTomorrow(it.deadline) ? thTime(it.deadline) : null),
            detail: formatDetail(it.description),
            tags: formatTags(it.tag_ids),
            edge: it.kind === '📅 Event' ? CARD.cyan : '#FFFFFF',
          });
          noticeCard = noticeBeforeCard({
            date: cardDate(tomorrow),
            events: noticeItems.filter((it) => it.kind === '📅 Event').map(toItem),
            tasks: noticeItems.filter((it) => it.kind !== '📅 Event').map(toItem),
          });
        }

        // Missed-deadline repeats: tasks still not done whose deadline was on an earlier day (within
        // the last 3 days) get one more nudge each morning, all in one message. The first nudge came
        // from send-line-overdue just after the deadline.
        let overdueCards: LineMessage | null = null;
        let overdueText: LineMessage | null = null;
        // Which repeats were marked as sent today (undone if their push fails)
        const repeatIds: string[] = [];
        let repeatKey = '';
        if (link.overdue_enabled) {
          const startOfToday = new Date(`${today}T00:00:00+07:00`);
          const { data: late } = await supabase
            .from('tasks')
            .select('id, title, description, deadline, tag_ids')
            .eq('user_id', link.user_id)
            .eq('is_completed', false)
            .is('recurrence_unit', null)
            .lt('deadline', startOfToday.toISOString())
            .gte('deadline', new Date(Date.now() - 3 * 86400000).toISOString())
            .order('deadline', { ascending: true });
          const repeats: MissedTask[] = [];
          repeatKey = startOfToday.toISOString();
          for (const t of late ?? []) {
            if (repeats.length >= MAX_NUDGES_PER_MESSAGE) break;
            // Once a day per task: the day's start is the key
            const { error: markErr } = await supabase.from('line_reminders_sent').insert({
              user_id: link.user_id, item_type: 'task_overdue_repeat', item_id: t.id, occurrence_at: startOfToday.toISOString(),
            });
            if (markErr) continue;
            repeatIds.push(t.id);
            repeats.push({
              id: t.id,
              title: t.title,
              deadline: t.deadline as string,
              detail: formatDetail(t.description),
              tags: formatTags(t.tag_ids),
              daysOverdue: Math.max(1, daysSince(t.deadline as string)),
            });
          }
          if (repeats.length > 0) {
            overdueCards = missedDeadlinesMessage(name ?? undefined, repeats);
            overdueText = { type: 'text', text: missedDeadlinesText(name ?? undefined, repeats) };
          }
        }

        // Send in order: the letter (+ photos), the notice, the missed deadlines, then the sign-off
        // and sticker together at the very end. LINE counts each push as one message (up to 5
        // bubbles), so they are packed into as few pushes as possible.
        const fallback = new Map<LineMessage, LineMessage>([[letterCard, digestText]]);
        const ordered: LineMessage[] = sendLetter ? [...digest] : [];
        if (noticeCard && noticeText) {
          ordered.push(noticeCard);
          fallback.set(noticeCard, noticeText);
        }
        if (overdueCards && overdueText) {
          ordered.push(overdueCards);
          fallback.set(overdueCards, overdueText);
        }
        // Letter off and nothing else for today
        if (ordered.length === 0) continue;
        const pushes: LineMessage[][] = [];
        for (const m of ordered) {
          const last = pushes[pushes.length - 1];
          if (last && last.length < 5) last.push(m);
          else pushes.push([m]);
        }
        // The sign-off and sticker close the morning letter (not a notice or nudge on its own)
        if (sendLetter) {
          const last = pushes[pushes.length - 1];
          if (last.length + signOff.length <= 5) last.push(...signOff);
          else pushes.push([...signOff]);
        }

        for (const batch of pushes) {
          try {
            await pushMessages(accessToken, link.line_user_id as string, batch);
          } catch (err) {
            // If LINE rejects a card, send the same push again with the plain-text versions
            console.error(`LINE cards rejected for user ${link.user_id}, sending text instead:`, err);
            try {
              await pushMessages(accessToken, link.line_user_id as string, batch.map((m) => fallback.get(m) ?? m));
            } catch (textErr) {
              // The missed-deadline repeats in this push never arrived: forget today's marks so
              // the next run that day (e.g. the LINE "today" command) can send them
              if (overdueCards && batch.includes(overdueCards)) {
                await Promise.all(repeatIds.map((id) =>
                  supabase.from('line_reminders_sent').delete()
                    .eq('user_id', link.user_id).eq('item_type', 'task_overdue_repeat')
                    .eq('item_id', id).eq('occurrence_at', repeatKey)
                ));
              }
              throw textErr;
            }
          }
        }
        sent++;
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
