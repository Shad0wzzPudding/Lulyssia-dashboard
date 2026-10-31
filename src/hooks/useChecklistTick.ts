import { useCallback, useEffect } from 'react';
import { onlineManager, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { checklistProgress, toggleCheck } from '@/lib/checklist';

type Table = 'tasks' | 'events' | 'interests';
type Item = { id: string; description?: string | null };
type Save = (description: string) => void;

/**
 * Ticks made on cards that aren't saved yet, per item: the description they should end up with. A
 * tick shows at once (the lists everywhere are updated before the save), the next tick builds on
 * it, and one save per item runs at a time, always with the latest ticks, so quick ticks are never
 * lost to a save made from an older description.
 */
const waiting = new Map<string, { table: Table; id: string; description: string; save: Save }>();
/** Per item, the description of the save running now. */
const sending = new Map<string, string>();
let watched: QueryClient | null = null;

const showInLists = (queryClient: QueryClient, table: Table, id: string, description: string) => {
  const list = queryClient.getQueryData<Item[]>([table]);
  // Only when it differs: setting the list (even unchanged) wakes the watcher below again
  if (!list?.some((item) => item.id === id && item.description !== description)) return;
  queryClient.setQueryData<Item[]>([table], list.map((item) => (item.id === id ? { ...item, description } : item)));
};

// A list reloaded while ticks wait (after the previous save) would show them unticked again: put
// them back. A save's end is read from the mutation cache, because the callbacks given to
// `mutate` only run for the latest call of a mutation, and ticks on two cards would lose one.
const watch = (queryClient: QueryClient) => {
  if (watched === queryClient) return;
  watched = queryClient;
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated' || event.action.type !== 'success') return;
    const table = event.query.queryKey[0];
    waiting.forEach((tick) => {
      if (tick.table === table) showInLists(queryClient, tick.table, tick.id, tick.description);
    });
  });
  queryClient.getMutationCache().subscribe((event) => {
    if (event.type !== 'updated' || (event.action.type !== 'success' && event.action.type !== 'error')) return;
    const vars = event.mutation.state.variables as { id?: string; description?: string } | undefined;
    if (!vars?.id || vars.description === undefined) return;
    sending.forEach((description, key) => {
      const tick = waiting.get(key);
      if (!tick || tick.id !== vars.id || description !== vars.description) return;
      sending.delete(key);
      if (event.action.type === 'error') {
        // Not saved (the save shows its message): show what's saved again
        waiting.delete(key);
        queryClient.invalidateQueries({ queryKey: [tick.table] });
      } else if (tick.description !== description) {
        // More ticks came while this save ran: send them
        send(key);
      } else {
        waiting.delete(key);
      }
    });
  });
};

const send = (key: string) => {
  const tick = waiting.get(key);
  if (!tick || sending.has(key)) return;
  sending.set(key, tick.description);
  tick.save(tick.description);
};

/**
 * A box ticked (or unticked) straight on a card: `line` of the item's description changes and is
 * saved at once. Offline it's refused with a message (a save made offline would wait and go
 * through later, unseen). `onAllTicked` runs when this tick completes the checklist.
 */
export function useChecklistTick() {
  const queryClient = useQueryClient();
  useEffect(() => watch(queryClient), [queryClient]);

  return useCallback((table: Table, id: string, line: number, save: Save, onAllTicked?: () => void) => {
    if (!onlineManager.isOnline()) {
      toast.error("Couldn't save. Check your connection and try again.");
      return;
    }
    const key = `${table}:${id}`;
    const current = waiting.get(key)?.description
      ?? queryClient.getQueryData<Item[]>([table])?.find((item) => item.id === id)?.description
      ?? '';
    const next = toggleCheck(current, line);
    if (next === current) return;
    waiting.set(key, { table, id, description: next, save });
    showInLists(queryClient, table, id, next);
    send(key);
    const before = checklistProgress(current);
    const after = checklistProgress(next);
    if (onAllTicked && after.total > 0 && after.done === after.total && before.done < before.total) onAllTicked();
  }, [queryClient]);
}
