import { useCallback, useRef } from 'react';

/**
 * Lets an action on an item run once per short moment: a double click on a card's Delete or Done
 * button otherwise sends the same save twice (two "deleted" messages and sounds, a second request
 * that finds nothing). The key names the item and what is done to it (e.g. `${id}:done`), so the
 * opposite action (ticking, then unticking right away) still goes through.
 */
export function useRepeatGuard(ms = 1500) {
  const last = useRef(new Map<string, number>());
  return useCallback((key: string) => {
    const now = Date.now();
    const at = last.current.get(key);
    if (at !== undefined && now - at < ms) return false;
    last.current.set(key, now);
    return true;
  }, [ms]);
}
