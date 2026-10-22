import { parseChars } from '@/lib/inlineFormat';

const SORT_OPTIONS = [
  'created_desc',
  'created_asc',
  'deadline_asc',
  'deadline_desc',
  'title_asc',
  'title_desc',
  'tag',
  'user',
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];

/** True for a sort the menus offer (a saved one may be old, e.g. the removed "Pinned first") */
export const isSortOption = (value: unknown): value is SortOption =>
  (SORT_OPTIONS as readonly unknown[]).includes(value);

export const sortItems = <T extends { created_at: string; title: string; deadline?: string; tag_ids?: string[]; sort_order?: number }>(
  items: T[],
  sort: SortOption,
  tagsById?: Record<string, { name: string }>,
  /** The date the two date sorts use: the deadline, unless a page says otherwise (Events: start time) */
  dateOf: (item: T) => string | null | undefined = (item) => item.deadline
): T[] => {
  const arr = [...items];
  switch (sort) {
    case 'created_desc':
      return arr.sort((a, b) => b.created_at.localeCompare(a.created_at));
    case 'created_asc':
      return arr.sort((a, b) => a.created_at.localeCompare(b.created_at));
    case 'deadline_asc':
      return arr.sort((a, b) => (dateOf(a) || '\uffff').localeCompare(dateOf(b) || '\uffff'));
    case 'deadline_desc':
      return arr.sort((a, b) => (dateOf(b) || '').localeCompare(dateOf(a) || ''));
    case 'title_asc':
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case 'title_desc':
      return arr.sort((a, b) => b.title.localeCompare(a.title));
    case 'tag':
      return arr.sort((a, b) => {
        // The first tag that still exists (an old copy restored by Undo may hold a deleted one)
        const firstName = (ids?: string[] | null) =>
          (ids ?? []).map((id) => tagsById?.[id]?.name).find(Boolean) || '\uffff';
        return firstName(a.tag_ids).localeCompare(firstName(b.tag_ids));
      });
    case 'user':
      return arr.sort((a, b) => {
        const ao = a.sort_order ?? 0;
        const bo = b.sort_order ?? 0;
        if (ao !== bo) return ao - bo;
        return a.created_at.localeCompare(b.created_at);
      });
    default:
      return arr;
  }
};

export const filterByTags = <T extends { tag_ids?: string[] }>(
  items: T[],
  tagIds: string[]
): T[] => {
  if (tagIds.length === 0) return items;
  return items.filter((i) => i.tag_ids?.some((id) => tagIds.includes(id)));
};

export const searchItems = <T extends { title: string; description?: string | null }>(
  items: T[],
  query: string
): T[] => {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (i) =>
      i.title.toLowerCase().includes(q) ||
      // The description as it reads on screen: without the bold/italic/strike marks, and with the
      // stored escapes turned back into the * ~ and backslash typed (so "5*3" or a bold word is found)
      parseChars(i.description || '').map((c) => c.ch).join('').toLowerCase().includes(q)
  );
};
