/** Which of today's items a Today section shows: all, those that start today, or those that end today. */
export type TodayTab = 'all' | 'start' | 'end';

/** The items a tab shows (an item that starts and ends today is under both Start and End). */
export const itemsForTab = <T,>(items: T[], tab: TodayTab, startsToday: (item: T) => boolean, endsToday: (item: T) => boolean): T[] =>
  tab === 'all' ? items : items.filter(tab === 'start' ? startsToday : endsToday);

/** What a tab says when it has nothing. */
export const emptyTabText = (tab: TodayTab) => (tab === 'start' ? 'Nothing starts today' : 'Nothing ends today');
