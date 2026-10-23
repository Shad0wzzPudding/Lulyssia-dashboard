/**
 * True when both are set and the deadline (or end) is strictly before the start. Both are the
 * forms' datetime-local values ("2026-10-13T09:00"); equal times are fine, and a missing one
 * leaves nothing to compare.
 */
export const deadlineBeforeStart = (start: string, deadline: string) =>
  !!start && !!deadline && new Date(deadline).getTime() < new Date(start).getTime();

export const DEADLINE_BEFORE_START_MESSAGE = 'The deadline is before the start. Pick a later deadline or an earlier start.';
/** The same for events, whose second date is called "End" */
export const END_BEFORE_START_MESSAGE = 'The end is before the start. Pick a later end or an earlier start.';
