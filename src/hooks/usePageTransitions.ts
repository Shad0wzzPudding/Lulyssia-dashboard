import { useSyncExternalStore } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * An on/off setting saved per device in this browser (on by default unless `defaultValue` says otherwise).
 * Changing it updates every component using it right away (no reload).
 */
const createDeviceSetting = (storageKey: string, defaultValue = true) => {
  const listeners = new Set<() => void>();

  const read = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored === null ? defaultValue : stored === 'true';
    } catch {
      return defaultValue;
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

  const useValue = () => useSyncExternalStore(subscribe, read, () => defaultValue);

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

// "Reduce flashing": no bright flashes or screen shakes (the drawer's opening slash, the skill
// cut-in's white flash and shake), for people sensitive to flashing. Off by default.
const reduceFlashing = createDeviceSetting('reduceFlashing', false);
export const setReduceFlashing = reduceFlashing.set;
/** The "Reduce flashing" switch itself (for Settings). */
export const useReduceFlashingSetting = reduceFlashing.useValue;
/** Whether flashes and shakes are off: the switch is on, or the device asks for reduced motion. */
export const useReduceFlashing = () => {
  const setting = reduceFlashing.useValue();
  const deviceReducedMotion = useReducedMotion();
  return setting || !!deviceReducedMotion;
};
