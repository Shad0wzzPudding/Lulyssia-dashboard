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

// "Page transitions": the train crowd animation when switching pages. A device that asks for
// reduced motion gets its own switch, off until turned on here, so the app starts calm there but
// the person can still choose the train; the usual switch is kept for when that device setting is off.
const pageTransitions = createDeviceSetting('pageTransitionsEnabled');
const pageTransitionsReducedMotion = createDeviceSetting('pageTransitionsWithReducedMotion', false);
/** The "Page transitions" switch for this device's motion setting (for Settings). */
export const usePageTransitionsSwitch = () => {
  const deviceReducedMotion = !!useReducedMotion();
  const usual = pageTransitions.useValue();
  const reduced = pageTransitionsReducedMotion.useValue();
  return deviceReducedMotion
    ? { checked: reduced, set: pageTransitionsReducedMotion.set }
    : { checked: usual, set: pageTransitions.set };
};
/** Whether the crowd transition plays when switching pages. */
export const usePageTransitions = () => usePageTransitionsSwitch().checked;

// "Animating menu": moving effects in the side drawer (water, butterflies, bubbles, float, sparkles)
const menuAnimations = createDeviceSetting('menuAnimationsEnabled');
export const setMenuAnimationsEnabled = menuAnimations.set;
/** Whether the side drawer's decorations move (they are always shown either way). */
export const useMenuAnimations = menuAnimations.useValue;

// "Enable flashing": bright flashes and screen shakes (the drawer's opening slash, the skill
// cut-in's white flash and shake). On by default; off by default on a device that asks for reduced
// motion, which has its own switch like Page transitions. Saved as "reduceFlashing" (the switch's
// old, reversed name), so earlier choices are kept.
const reduceFlashing = createDeviceSetting('reduceFlashing', false);
const flashingReducedMotion = createDeviceSetting('flashingWithReducedMotion', false);
/** The "Enable flashing" switch for this device's motion setting (for Settings). */
export const useFlashingSwitch = () => {
  const deviceReducedMotion = !!useReducedMotion();
  const reduce = reduceFlashing.useValue();
  const reducedMotionFlashing = flashingReducedMotion.useValue();
  return deviceReducedMotion
    ? { checked: reducedMotionFlashing, set: flashingReducedMotion.set }
    : { checked: !reduce, set: (enabled: boolean) => reduceFlashing.set(!enabled) };
};
/** Whether flashes and shakes are off. */
export const useReduceFlashing = () => !useFlashingSwitch().checked;

// The "!" on Settings' Animating menu card, telling a device that asks for reduced motion that the
// train and flashing are off but can be turned on there. Gone for good once looked at.
const motionNoticeSeen = createDeviceSetting('motionNoticeSeen', false);
export const useMotionNoticeSeen = motionNoticeSeen.useValue;
export const markMotionNoticeSeen = () => motionNoticeSeen.set(true);
