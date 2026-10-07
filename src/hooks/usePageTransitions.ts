import { useSyncExternalStore } from 'react';

// "Page transitions" setting, saved per device in this browser (on by default)
const STORAGE_KEY = 'pageTransitionsEnabled';
const listeners = new Set<() => void>();

const read = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const setPageTransitionsEnabled = (enabled: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch { /* storage unavailable: the change still applies until reload */ }
  listeners.forEach((listener) => listener());
};

/** Whether the crowd transition plays when switching pages. */
export const usePageTransitions = () => useSyncExternalStore(subscribe, read, () => true);
