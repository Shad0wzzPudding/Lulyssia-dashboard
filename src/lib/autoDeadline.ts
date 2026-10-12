import { addHours, format } from 'date-fns';

/**
 * The deadline the Tasks and Events forms fill in from a start time: 5 hours later.
 * Both take and give datetime-local values ("2026-10-13T09:00"); an empty start gives ''.
 */
export const autoDeadline = (start: string) =>
  start ? format(addHours(new Date(start), 5), "yyyy-MM-dd'T'HH:mm") : '';
