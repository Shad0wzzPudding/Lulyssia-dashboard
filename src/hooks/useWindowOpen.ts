import { useEffect, useSyncExternalStore } from 'react';

/**
 * How many dialog windows (the add/edit forms and the other windows built on Dialog) are open
 * right now, so the round menu button can slide out of the way while one is.
 */
let openWindows = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

/** Counts the calling window as open while `isOpen` (from the moment it opens until it starts closing). */
export const useCountAsOpenWindow = (isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen) return;
    openWindows += 1;
    notify();
    return () => {
      openWindows -= 1;
      notify();
    };
  }, [isOpen]);
};

/** True while any dialog window is open. */
export const useAnyWindowOpen = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => openWindows > 0,
    () => false
  );
