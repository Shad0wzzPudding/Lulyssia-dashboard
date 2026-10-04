export type SortOption =
  | 'created_desc'
  | 'created_asc'
  | 'deadline_asc'
  | 'deadline_desc'
  | 'title_asc'
  | 'title_desc'
  | 'tag'
  | 'pinned_first'
  | 'completed_last'
  | 'user';

export const sortItems = <T extends { created_at: string; title: string; deadline?: string; is_pinned?: boolean; is_completed?: boolean; tag_ids?: string[]; sort_order?: number }>(
  items: T[],
  sort: SortOption,
  tagsById?: Record<string, { name: string }>
): T[] => {
  const arr = [...items];
  switch (sort) {
    case 'created_desc':
      return arr.sort((a, b) => b.created_at.localeCompare(a.created_at));
    case 'created_asc':
      return arr.sort((a, b) => a.created_at.localeCompare(b.created_at));
    case 'deadline_asc':
      return arr.sort((a, b) => (a.deadline || '\uffff').localeCompare(b.deadline || '\uffff'));
    case 'deadline_desc':
      return arr.sort((a, b) => (b.deadline || '').localeCompare(a.deadline || ''));
    case 'title_asc':
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case 'title_desc':
      return arr.sort((a, b) => b.title.localeCompare(a.title));
    case 'tag':
      return arr.sort((a, b) => {
        const an = a.tag_ids?.[0] && tagsById?.[a.tag_ids[0]]?.name || '\uffff';
        const bn = b.tag_ids?.[0] && tagsById?.[b.tag_ids[0]]?.name || '\uffff';
        return an.localeCompare(bn);
      });
    case 'pinned_first':
      return arr.sort((a, b) => Number(!!b.is_pinned) - Number(!!a.is_pinned));
    case 'completed_last':
      return arr.sort((a, b) => Number(!!a.is_completed) - Number(!!b.is_completed));
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
      (i.description || '').toLowerCase().includes(q)
  );
};
