import { useEffect, useRef } from 'react';

/** How long a finger must rest on an item before it is picked up */
const HOLD_MS = 450;
/** Moving further than this before the hold ends means the finger is scrolling */
const MOVE_TOLERANCE_PX = 10;
/** Near the top or bottom of the screen the page scrolls along while dragging */
const EDGE_PX = 70;
const EDGE_SCROLL_PX = 12;

/** Data attribute holding each draggable item's index (`data-reorder-index={i}`) */
export const REORDER_INDEX_ATTR = 'data-reorder-index';

/** True on phones and tablets (a finger, not a mouse), where touch dragging replaces mouse dragging */
export const isCoarsePointer = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;

interface TouchReorderCallbacks {
  /** An item was picked up (after the hold) */
  onPickUp: (index: number) => void;
  /** The finger is over this item */
  onOver: (index: number) => void;
  /** Let go: move `from` to `to` (they may be equal) */
  onDrop: (from: number, to: number) => void;
  /** The drag ended without a drop target */
  onCancel: () => void;
}

/**
 * Touch dragging for a reorderable group: press and hold an item to pick it up, then drag it in
 * any direction. A quick swipe still scrolls the page. Items inside the container are marked
 * with `data-reorder-index`. Mouse dragging is left to the existing HTML drag and drop.
 */
export function useTouchReorder<T extends HTMLElement>(callbacks: TouchReorderCallbacks) {
  const containerRef = useRef<T>(null);
  // Latest callbacks, so the listeners (added once) never see stale state
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let holdTimer: number | undefined;
    let edgeFrame: number | undefined;
    let pressedIndex: number | null = null;
    let overIndex: number | null = null;
    let picked = false;
    let start = { x: 0, y: 0 };
    let lastY = 0;

    const indexAt = (x: number, y: number) => {
      const el = document.elementFromPoint(x, y)?.closest(`[${REORDER_INDEX_ATTR}]`);
      if (!el || !container.contains(el)) return null;
      const i = Number(el.getAttribute(REORDER_INDEX_ATTR));
      return Number.isNaN(i) ? null : i;
    };

    const stopEdgeScroll = () => {
      if (edgeFrame !== undefined) cancelAnimationFrame(edgeFrame);
      edgeFrame = undefined;
    };

    const edgeScroll = () => {
      if (lastY < EDGE_PX) window.scrollBy(0, -EDGE_SCROLL_PX);
      else if (lastY > window.innerHeight - EDGE_PX) window.scrollBy(0, EDGE_SCROLL_PX);
      edgeFrame = requestAnimationFrame(edgeScroll);
    };

    const reset = () => {
      window.clearTimeout(holdTimer);
      stopEdgeScroll();
      pressedIndex = null;
      overIndex = null;
      picked = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return reset();
      const touch = e.touches[0];
      const el = (e.target as Element | null)?.closest(`[${REORDER_INDEX_ATTR}]`);
      if (!el || !container.contains(el)) return;
      pressedIndex = Number(el.getAttribute(REORDER_INDEX_ATTR));
      if (Number.isNaN(pressedIndex)) return reset();
      start = { x: touch.clientX, y: touch.clientY };
      lastY = touch.clientY;
      holdTimer = window.setTimeout(() => {
        if (pressedIndex === null) return;
        picked = true;
        overIndex = pressedIndex;
        navigator.vibrate?.(15);
        callbacksRef.current.onPickUp(pressedIndex);
        edgeFrame = requestAnimationFrame(edgeScroll);
      }, HOLD_MS);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (pressedIndex === null) return;
      const touch = e.touches[0];
      if (!picked) {
        // Moved before the hold ended: it's a scroll, let the page have it
        if (Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > MOVE_TOLERANCE_PX) reset();
        return;
      }
      // Holding an item: the finger moves the item, not the page
      e.preventDefault();
      lastY = touch.clientY;
      const i = indexAt(touch.clientX, touch.clientY);
      if (i !== null && i !== overIndex) {
        overIndex = i;
        callbacksRef.current.onOver(i);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (picked && pressedIndex !== null) {
        // Don't let the release count as a tap on the item (or a button inside it)
        if (e.cancelable) e.preventDefault();
        if (e.type === 'touchend' && overIndex !== null) callbacksRef.current.onDrop(pressedIndex, overIndex);
        else callbacksRef.current.onCancel();
      }
      reset();
    };

    // A long press would otherwise open the phone's own menu or start selecting text
    const onContextMenu = (e: Event) => {
      if (pressedIndex !== null) e.preventDefault();
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: false });
    container.addEventListener('touchcancel', onTouchEnd, { passive: false });
    container.addEventListener('contextmenu', onContextMenu);
    return () => {
      reset();
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
      container.removeEventListener('contextmenu', onContextMenu);
    };
  }, []);

  return containerRef;
}
