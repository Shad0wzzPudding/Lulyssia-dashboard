import { addDays, addHours, addWeeks, format } from 'date-fns';
import { parseChars } from '@/lib/inlineFormat';
import type { Preset } from '@/lib/types';

/** How a preset's format goes into a description that already has text */
export type ApplyHow = 'add' | 'replace';

/** The part of the task or event form a preset fills in (dates as datetime-local values) */
export type PresetFormFields = {
  title: string;
  description: string;
  start: string;
  deadline: string;
  tag_ids: string[];
};

/** A preset's due offset, kept by the form so a changed start keeps the Deadline / End at start + X */
export type DueOffset = Pick<Preset, 'due_amount' | 'due_unit'>;

const LOCAL = "yyyy-MM-dd'T'HH:mm";

/** The description as it reads (without the formatting marks) has something besides spaces */
export const descriptionHasText = (description: string) =>
  parseChars(description).some((c) => c.ch.trim() !== '');

/** The plain text of a description format (the marks taken out), as the preset cards show it */
export const plainFormat = (description: string) => parseChars(description).map((c) => c.ch).join('');

/** start + the offset, to the minute ('' with no start or no offset) */
export const offsetFrom = (start: string, offset: DueOffset | null) => {
  if (!start || !offset?.due_amount || !offset.due_unit) return '';
  const from = new Date(start);
  if (isNaN(from.getTime())) return '';
  const add = offset.due_unit === 'hours' ? addHours : offset.due_unit === 'weeks' ? addWeeks : addDays;
  return format(add(from, offset.due_amount), LOCAL);
};

/**
 * The form after "Apply preset": an empty title gets the name; the format goes into an empty
 * description (or, with text there, below it after a blank line, or instead of it); the tags are
 * added; with a due offset the Deadline / End becomes start + X (the start now, to the minute,
 * when empty). Nothing else changes.
 */
export const applyPreset = (form: PresetFormFields, preset: Preset, how: ApplyHow | undefined, now = new Date()): PresetFormFields => {
  const next = { ...form };
  if (!form.title.trim()) next.title = preset.name;
  if (preset.description) {
    if (how === 'replace' || !descriptionHasText(form.description)) next.description = preset.description;
    else next.description = `${form.description.replace(/\s+$/, '')}\n\n${preset.description}`;
  }
  next.tag_ids = [...form.tag_ids, ...preset.tag_ids.filter((id) => !form.tag_ids.includes(id))];
  if (preset.due_amount && preset.due_unit) {
    if (!next.start) next.start = format(now, LOCAL);
    next.deadline = offsetFrom(next.start, preset);
  }
  return next;
};

/**
 * The Deadline / End after the start was changed by hand: start + X while it still sits at the
 * old start + X (a preset's offset), otherwise the usual rule (`fallback`)
 */
export const followStart = (prevStart: string, prevDeadline: string, nextStart: string, offset: DueOffset | null, fallback: () => string) => {
  if (nextStart && offset && prevDeadline && prevDeadline === offsetFrom(prevStart, offset)) return offsetFrom(nextStart, offset);
  return fallback();
};
