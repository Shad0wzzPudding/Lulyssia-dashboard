// Missed-deadline nudges, shared by send-line-overdue (the first nudge, just after the deadline)
// and send-line-daily (the daily repeats, with the morning letter). Several tasks go out as one
// message: a single card for one task, a carousel of cards for two or more.
import { CARD, flexText, labelRow, lineCard, tagChip, type FlexMessage } from './lineCard.ts';

const TH_OFFSET_MS = 7 * 60 * 60 * 1000;

// LINE allows up to 12 cards in one carousel
export const MAX_NUDGES_PER_MESSAGE = 12;

export const NUDGES = [
  "Hey, it's already past due. Want to have a look?",
  'That one slipped by — want to finish it now?',
  "Deadline's gone, but maybe you can still catch it.",
  'I think you need to check on this one.',
];

export type MissedTask = {
  id: string;
  title: string;
  deadline: string;
  detail: string | null;
  tags: string;
  /** Whole days since the deadline (Thai calendar): 0 for the first nudge, 1+ for repeats */
  daysOverdue: number;
};

/** "Fri 9 Oct, 23:59" in Thai time. */
export function cardDateTime(iso: string): string {
  const s = new Date(new Date(iso).getTime() + TH_OFFSET_MS);
  const day = s.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const p = (n: number) => String(n).padStart(2, '0');
  return `${day}, ${p(s.getUTCHours())}:${p(s.getUTCMinutes())}`;
}

/** "09/10 23:59" in Thai time, for the plain-text version. */
function textDateTime(iso: string): string {
  const s = new Date(new Date(iso).getTime() + TH_OFFSET_MS);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(s.getUTCDate())}/${p(s.getUTCMonth() + 1)} ${p(s.getUTCHours())}:${p(s.getUTCMinutes())}`;
}

/** Calendar days (Thai time) from the deadline's date to today's date. */
export function daysSince(deadlineIso: string, now: Date = new Date()): number {
  const day = (d: Date) => Math.floor((d.getTime() + TH_OFFSET_MS) / 86400000);
  return Math.max(0, day(now) - day(new Date(deadlineIso)));
}

const pickNudge = () => NUDGES[Math.floor(Math.random() * NUDGES.length)];

/** One task's card: the task, when it was due (and for how long), detail, tags, her nudge and a
    "Mark as done" button (a postback line-webhook handles). */
function missedDeadlineCard(name: string | undefined, task: MissedTask): FlexMessage {
  const { id, title, deadline, detail, tags, daysOverdue } = task;
  return lineCard({
    banner: 'missed-deadline',
    altText: `⚠️ Missed deadline: ${title}`,
    button: 'Open in dashboard',
    actions: [{
      type: 'button',
      style: 'secondary',
      color: CARD.chip,
      height: 'sm',
      action: {
        type: 'postback',
        label: '✓ Mark as done',
        data: `done:${id}`,
        displayText: `Mark "${title.slice(0, 200)}" as done`,
      },
    }],
    body: [
      flexText(`⚠️ Missed deadline${name ? `, ${name}` : ''}!`, { size: 'sm', weight: 'bold', color: CARD.warn }),
      flexText('📋 TASK', { size: 'xs', weight: 'bold', color: CARD.date }),
      flexText(title, { size: 'xl', weight: 'bold', color: CARD.ink }),
      labelRow('Was due', cardDateTime(deadline), CARD.warn),
      ...(daysOverdue > 0 ? [labelRow('Overdue', `${daysOverdue} day${daysOverdue === 1 ? '' : 's'}`, CARD.warn)] : []),
      ...(detail ? [flexText(detail, { size: 'sm', color: CARD.detail, maxLines: 5 })] : []),
      ...(tags ? [tagChip(tags)] : []),
      { type: 'separator', color: CARD.line },
      flexText(`"${pickNudge()}"`, { size: 'sm', style: 'italic', color: CARD.detail }),
    ],
  });
}

/** One message for up to 12 tasks: a single card, or a carousel of cards (swipe through). */
export function missedDeadlinesMessage(name: string | undefined, tasks: MissedTask[]): FlexMessage {
  const cards = tasks.slice(0, MAX_NUDGES_PER_MESSAGE).map((t) => missedDeadlineCard(name, t));
  if (cards.length === 1) return cards[0];
  return {
    type: 'flex',
    altText: `⚠️ ${cards.length} missed deadlines`,
    contents: { type: 'carousel', contents: cards.map((c) => c.contents) },
  };
}

/** The same nudge as plain text, if LINE ever rejects the cards. */
export function missedDeadlinesText(name: string | undefined, tasks: MissedTask[]): string {
  const blocks = tasks.slice(0, MAX_NUDGES_PER_MESSAGE).map((t) => [
    '📋 Task',
    `Name : ${t.title}`,
    'Detail :',
    t.detail ?? '-',
    `Deadline was : ${textDateTime(t.deadline)}${t.daysOverdue > 0 ? ` (${t.daysOverdue} day${t.daysOverdue === 1 ? '' : 's'} ago)` : ''}`,
    ...(t.tags ? [`🏷 Tag : ${t.tags}`] : []),
  ].join('\n'));
  const head = tasks.length === 1
    ? `⚠️ Missed deadline${name ? `, ${name}` : ''}!`
    : `⚠️ ${Math.min(tasks.length, MAX_NUDGES_PER_MESSAGE)} missed deadlines${name ? `, ${name}` : ''}!`;
  return [head, '', blocks.join('\n\n'), '', `"${pickNudge()}"`].join('\n').slice(0, 4900);
}
