import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { playSelectModeCloseSound, preloadSelectModeSounds } from '@/lib/sounds';

const snap = { type: 'spring', stiffness: 420, damping: 32 } as const;

/**
 * Persona 5 style frame shown while Select mode is on: slanted cyan bars along the
 * top and bottom edges, a "SELECT MODE" banner, and a soft cyan glow at the edges.
 * It never blocks taps (pointer-events-none), so cards stay clickable underneath.
 */
export const SelectModeOverlay = ({ visible, onExit }: { visible: boolean; onExit: () => void }) => {
  // Load the open/close sounds up front so the first use plays them instantly
  useEffect(() => {
    preloadSelectModeSounds();
  }, []);

  // Close sound plays here, so it covers every way select mode ends
  // (X, Esc, deselecting the last card, or after an action like Delete)
  const wasVisible = useRef(visible);
  useEffect(() => {
    if (wasVisible.current && !visible) playSelectModeCloseSound();
    wasVisible.current = visible;
  }, [visible]);

  // Esc exits select mode, like the red X. Skipped while a dialog is open (Esc closes
  // that dialog instead) or while typing in a field.
  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]')) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      onExit();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [visible, onExit]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-40 pointer-events-none overflow-hidden"
        >
          {/* Soft cyan glow around the edges; the middle stays clear so cards are easy to read */}
          <div className="absolute inset-0 shadow-[inset_0_0_80px_20px_hsl(var(--primary)/0.22)]" />

          {/* Top edge: cyan bar with a thin white bar under it, sweeping in from the left */}
          <motion.div
            initial={{ x: '-110%' }}
            animate={{ x: 0 }}
            exit={{ x: '-110%' }}
            transition={snap}
            className="absolute -left-8 -right-8 top-0"
          >
            <div className="h-3 -skew-x-[30deg] bg-primary" />
            <div className="ml-[18%] mt-1 h-1 -skew-x-[30deg] bg-foreground/80" />
          </motion.div>

          {/* Bottom edge: same bars, sweeping in from the right */}
          <motion.div
            initial={{ x: '110%' }}
            animate={{ x: 0 }}
            exit={{ x: '110%' }}
            transition={snap}
            className="absolute -left-8 -right-8 bottom-0"
          >
            <div className="mr-[18%] mb-1 h-1 -skew-x-[30deg] bg-foreground/80" />
            <div className="h-3 -skew-x-[30deg] bg-primary" />
          </motion.div>

          {/* "SELECT MODE" banner, dropping in with a slight tilt.
              Centered by a full-width flex wrapper, because framer-motion owns the
              banner's transform (a translate-x centering class would be overwritten). */}
          <div className="absolute inset-x-0 top-6 flex justify-center">
            <motion.div
              initial={{ y: -80, rotate: -8, opacity: 0 }}
              animate={{ y: 0, rotate: -3, opacity: 1 }}
              exit={{ y: -80, rotate: -8, opacity: 0 }}
              transition={{ ...snap, delay: 0.05 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-3">
                <span className="p5-title whitespace-nowrap text-xl sm:text-2xl">Select mode</span>
                {/* Exit button: the only clickable part of the overlay */}
                <button
                  type="button"
                  onClick={onExit}
                  aria-label="Exit select mode"
                  title="Exit select mode"
                  className="pointer-events-auto flex h-9 w-9 -skew-x-12 items-center justify-center border-2 border-foreground/80 bg-destructive text-destructive-foreground shadow-[3px_3px_0_0_hsl(var(--foreground)/0.8)] transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                >
                  <X size={18} strokeWidth={3} className="skew-x-12" />
                </button>
              </div>
              <span className="-skew-x-12 bg-background/90 px-3 py-0.5 text-xs font-semibold italic text-foreground">
                Tap cards to select
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
