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

/** One part of a search: a word (or phrase) to find, or one to hide (typed with "!"). */
export type SearchTerm = { word: string; hide: boolean };

/**
 * Reads a search like a filter: parts separated by commas mean "any of these", and a part starting
 * with "!" hides items that contain the rest of it ("lab, !draft"). Words without a comma stay one
 * phrase, as before. Quotes keep a comma or "!" as text ("\"!important\"", "\"milk, eggs\""); the
 * quote marks themselves aren't searched. Empty parts and a lone "!" are ignored.
 */
export const parseSearch = (query: string): SearchTerm[] => {
  const parts: string[] = [];
  let part = '';
  let quoted = false;
  for (const ch of query) {
    if (ch === '"') quoted = !quoted;
    if (ch === ',' && !quoted) {
      parts.push(part);
      part = '';
    } else {
      part += ch;
    }
  }
  parts.push(part);
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const hide = p.startsWith('!');
      let word = hide ? p.slice(1).trim() : p;
      if (word.length >= 2 && word.startsWith('"') && word.endsWith('"')) word = word.slice(1, -1);
      return { word: word.toLowerCase(), hide };
    })
    .filter((t) => t.word);
};

/** The search bar shows how it read a search (chips) only when it has a comma or a "!". */
export const searchHasFilter = (query: string) => /[,!]/.test(query);

export const searchItems = <T extends { title: string; description?: string | null }>(
  items: T[],
  query: string
): T[] => {
  const terms = parseSearch(query);
  if (terms.length === 0) return items;
  const find = terms.filter((t) => !t.hide).map((t) => t.word);
  const hide = terms.filter((t) => t.hide).map((t) => t.word);
  return items.filter((i) => {
    const title = i.title.toLowerCase();
    // The description as it reads on screen: without the bold/italic/strike marks, and with the
    // stored escapes turned back into the * ~ and backslash typed (so "5*3" or a bold word is found)
    const description = parseChars(i.description || '').map((c) => c.ch).join('').toLowerCase();
    const has = (word: string) => title.includes(word) || description.includes(word);
    // A word to hide always wins; then any of the words to find (none: everything else shows)
    if (hide.some(has)) return false;
    return find.length === 0 || find.some(has);
  });
};
