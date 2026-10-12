// Repeating tasks: when does a repeat fall on a given day (Thai calendar)?
// Repeats are counted from the task's first deadline (recurrence_anchor), the same way the
// dashboard renews them (renewRecurringTask in src/hooks/useDashboardData.ts): the n-th repeat
// is the anchor plus n steps, and a day the month doesn't have becomes its last day
// (31 Jan, monthly: 28 Feb, 31 Mar, 30 Apr...).

const TH_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 86400000;

/** The Thai calendar day of a moment, as a day number. */
const thDay = (d: Date) => Math.floor((d.getTime() + TH_OFFSET_MS) / DAY_MS);

/** `months` calendar months later in Thai time, at the same clock time; a missing day becomes the month's last day. */
function addMonthsTh(d: Date, months: number): Date {
  const s = new Date(d.getTime() + TH_OFFSET_MS);
  const year = s.getUTCFullYear();
  const month = s.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const shifted = Date.UTC(
    year, month, Math.min(s.getUTCDate(), lastDay),
    s.getUTCHours(), s.getUTCMinutes(), s.getUTCSeconds(), s.getUTCMilliseconds(),
  );
  return new Date(shifted - TH_OFFSET_MS);
}

/** The repeat (counted from `anchorIso`) that falls on `day`'s Thai date, or null if none does. */
export function repeatOn(anchorIso: string | null, unit: string | null, intervalRaw: number | null, day: Date): Date | null {
  if (!anchorIso || !unit) return null;
  const anchor = new Date(anchorIso);
  if (isNaN(anchor.getTime())) return null;
  const interval = Math.max(1, intervalRaw ?? 1);
  const target = thDay(day);
  const dayDiff = target - thDay(anchor);
  if (dayDiff < 0) return null;

  switch (unit) {
    case 'day':
    case 'days':
      return dayDiff % interval === 0 ? new Date(anchor.getTime() + dayDiff * DAY_MS) : null;
    case 'week':
    case 'weeks':
      return dayDiff % (7 * interval) === 0 ? new Date(anchor.getTime() + dayDiff * DAY_MS) : null;
    case 'month':
    case 'months':
    case 'year':
    case 'years': {
      const step = unit.startsWith('year') ? 12 * interval : interval;
      const a = new Date(anchor.getTime() + TH_OFFSET_MS);
      const t = new Date(target * DAY_MS);
      const months = (t.getUTCFullYear() - a.getUTCFullYear()) * 12 + (t.getUTCMonth() - a.getUTCMonth());
      if (months < 0 || months % step !== 0) return null;
      const occurrence = addMonthsTh(anchor, months);
      return thDay(occurrence) === target ? occurrence : null;
    }
    default:
      return null;
  }
}

type RepeatingTask = {
  deadline: string | null;
  start_date: string | null;
  recurrence_unit: string | null;
  recurrence_interval: number | null;
  recurrence_anchor?: string | null;
};

/** A repeating task's deadline repeat on `day`'s Thai date (counted from its first deadline), or null. */
export function deadlineRepeatOn(task: RepeatingTask, day: Date): Date | null {
  return repeatOn(task.recurrence_anchor || task.deadline, task.recurrence_unit, task.recurrence_interval, day);
}

/**
 * A repeating task's start repeat on `day`'s Thai date, or null. Like the dashboard, a round's
 * start sits the same distance before that round's deadline (so 31 Jan / 28 Feb / 31 Mar
 * deadlines that start 2 days earlier start on 29 Jan / 26 Feb / 29 Mar). Without a deadline, the
 * start repeats on its own.
 */
export function startRepeatOn(task: RepeatingTask, day: Date): Date | null {
  if (!task.start_date) return null;
  const anchor = task.recurrence_anchor || task.deadline;
  if (!anchor || !task.deadline) return repeatOn(task.start_date, task.recurrence_unit, task.recurrence_interval, day);
  const before = new Date(task.deadline).getTime() - new Date(task.start_date).getTime();
  // A start on that day belongs to a deadline between (that day's start + gap) and (its end + gap):
  // at most two Thai days to look at
  const dayStart = thDay(day) * DAY_MS - TH_OFFSET_MS;
  for (const probe of [dayStart + before, dayStart + before + DAY_MS - 1]) {
    const deadline = repeatOn(anchor, task.recurrence_unit, task.recurrence_interval, new Date(probe));
    if (!deadline) continue;
    const start = new Date(deadline.getTime() - before);
    if (thDay(start) === thDay(day)) return start;
  }
  return null;
}
