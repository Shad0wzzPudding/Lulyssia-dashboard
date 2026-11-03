import { addHours, format, isSameDay, startOfHour } from 'date-fns';

/**
 * The date and time a new task's deadline or event's start gets when it's made from Home's calendar
 * for `day`, in the forms' yyyy-MM-ddTHH:mm format: on today, the next full hour from `now`
 * (10:20 → 11:00; from 23:00 on, 23:59 so it stays today); on any other day, 09:00. The device's
 * clock, as the forms use.
 */
export const presetTime = (day: Date, now = new Date()): string => {
  if (!isSameDay(day, now)) return format(day, "yyyy-MM-dd'T'09:00");
  if (now.getHours() >= 23) return format(now, "yyyy-MM-dd'T'23:59");
  return format(addHours(startOfHour(now), 1), "yyyy-MM-dd'T'HH:mm");
};
