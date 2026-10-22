import { useEffect, useState } from 'react';

/**
 * A flag that stays on for `ms` after `start()`, then turns itself off. Used to keep a button out of
 * reach for a moment, e.g. "Clear" right after "Undo" puts it back under the same spot.
 */
export function useBriefHold(ms: number) {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!held) return;
    const timer = window.setTimeout(() => setHeld(false), ms);
    return () => window.clearTimeout(timer);
  }, [held, ms]);
  return [held, () => setHeld(true)] as const;
}
