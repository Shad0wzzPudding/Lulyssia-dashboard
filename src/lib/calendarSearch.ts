import { format, isSameDay, parseISO, startOfDay } from 'date-fns';
import { parseSearch, searchItems } from '@/lib/sortAndFilter';
import type { Event, Task } from '@/lib/types';

/** One item found by the Calendar Overview's search, with the dates it has on the calendar */
export type CalendarHit = {
  type: 'task' | 'event';
  id: string;
  title: string;
  description?: string;
  /** Its start (tasks: start date, events: start time) */
  start?: Date;
  /** Its due date (tasks) or end (events) */
  end?: Date;
  /** The date picking it opens: its start, or its due/end with no start */
  opens: Date;
  /** Its last date: ended before today means "Past" */
  last: Date;
};

/** A found item's key (which row was picked) */
export const hitKey = (hit: { type: string; id: string }) => `${hit.type}-${hit.id}`;

/** A search counts only when it has at least one word (a lone "!" or "," doesn't start one) */
export const isCalendarSearch = (query: string) => parseSearch(query).length > 0;

const readDate = (value?: string | null) => {
  if (!value) return undefined;
  const date = parseISO(value);
  return isNaN(date.getTime()) ? undefined : date;
};

/**
 * What the calendar shows (unfinished tasks and every event) that the search finds, read like the
 * pages' search. Upcoming items (last date today or later) first, by the date they open; then the
 * past ones, the most recently ended first. Same time: by title.
 */
export const calendarHits = (tasks: Task[], events: Event[], query: string, now = new Date()) => {
  const items: CalendarHit[] = [];
  const add = (type: CalendarHit['type'], id: string, title: string, description: string | undefined, start?: Date, end?: Date) => {
    const opens = start ?? end;
    if (!opens) return; // no date: not on the calendar
    const last = end && start ? (end > start ? end : start) : opens;
    items.push({ type, id, title, description, start, end, opens, last });
  };
  tasks.forEach((t) => {
    if (!t.is_completed) add('task', t.id, t.title, t.description, readDate(t.start_date), readDate(t.deadline));
  });
  events.forEach((e) => add('event', e.id, e.title, e.description, readDate(e.start_time), readDate(e.deadline)));

  const today = startOfDay(now).getTime();
  const found = searchItems(items, query);
  const byTitle = (a: CalendarHit, b: CalendarHit) => a.title.localeCompare(b.title);
  const upcoming = found
    .filter((h) => startOfDay(h.last).getTime() >= today)
    .sort((a, b) => a.opens.getTime() - b.opens.getTime() || byTitle(a, b));
  const past = found
    .filter((h) => startOfDay(h.last).getTime() < today)
    .sort((a, b) => b.last.getTime() - a.last.getTime() || byTitle(a, b));
  return { upcoming, past };
};

/** The days the found items start or are due/end on (the calendar's highlights while searching) */
export const hitDays = (hits: CalendarHit[]) => {
  const days = new Map<number, Date>();
  hits.forEach((h) => {
    [h.start, h.end].forEach((d) => {
      if (!d) return;
      const day = startOfDay(d);
      days.set(day.getTime(), day);
    });
  });
  return [...days.values()];
};

/** "Tue 3 Nov, 10:46", with the year after the month when it isn't this year */
export const hitDate = (date: Date, now = new Date()) =>
  format(date, date.getFullYear() === now.getFullYear() ? 'EEE d MMM, HH:mm' : 'EEE d MMM yyyy, HH:mm');

/** A row's date lines: "Start …" (green) and "Due …" / "End …" (red), or one "Start and end …" */
export const hitDateLines = (hit: CalendarHit, now = new Date()) => {
  const { start, end } = hit;
  if (start && end && isSameDay(start, end)) {
    const day = isSameDay(start, now) ? 'today' : hitDate(start, now).replace(/, \d\d:\d\d$/, '');
    return { sameDay: `Start and end ${day}, ${format(start, 'HH:mm')}–${format(end, 'HH:mm')}` };
  }
  return {
    start: start ? `Start ${hitDate(start, now)}` : undefined,
    end: end ? `${hit.type === 'event' ? 'End' : 'Due'} ${hitDate(end, now)}` : undefined,
  };
};
