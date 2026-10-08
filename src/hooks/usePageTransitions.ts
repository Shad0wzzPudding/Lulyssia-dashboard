import { useSyncExternalStore } from 'react';

/**
 * An on/off setting saved per device in this browser, on by default.
 * Changing it updates every component using it right away (no reload).
 */
const createDeviceSetting = (storageKey: string) => {
  const listeners = new Set<() => void>();

  const read = () => {
    try {
      return localStorage.getItem(storageKey) !== 'false';
    } catch {
      return true;
    }
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const set = (enabled: boolean) => {
    try {
      localStorage.setItem(storageKey, String(enabled));
    } catch { /* storage unavailable: the change still applies until reload */ }
    listeners.forEach((listener) => listener());
  };

  const useValue = () => useSyncExternalStore(subscribe, read, () => true);

  return { set, useValue };
};

// "Page transitions": the train crowd animation when switching pages
const pageTransitions = createDeviceSetting('pageTransitionsEnabled');
export const setPageTransitionsEnabled = pageTransitions.set;
/** Whether the crowd transition plays when switching pages. */
export const usePageTransitions = pageTransitions.useValue;

// "Animating menu": moving effects in the side drawer (water, butterflies, bubbles, float, sparkles)
const menuAnimations = createDeviceSetting('menuAnimationsEnabled');
export const setMenuAnimationsEnabled = menuAnimations.set;
/** Whether the side drawer's decorations move (they are always shown either way). */
export const useMenuAnimations = menuAnimations.useValue;
