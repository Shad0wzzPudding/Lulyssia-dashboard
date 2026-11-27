import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from 'react';
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform, type MotionValue } from 'motion/react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import type { Preset, Tag } from '@/lib/types';
import { presetTags } from '@/lib/presets';
import { PresetCard, PresetLabel } from './PresetCard';

/** How far each step back sits: across, down, tilt, smaller; and how many px of drag move one card */
type StackStep = { x: number; y: number; r: number; s: number; sens: number };
const STEPS: StackStep[] = [
  { x: 90, y: 20, r: 8, s: 0.06, sens: 180 }, // under 640px
  { x: 130, y: 30, r: 10, s: 0.09, sens: 220 }, // 640 to 1023px
  { x: 170, y: 40, r: 12, s: 0.12, sens: 250 }, // from 1024px
];
/** Which of the step sizes the screen's width uses */
const stepFor = (width: number) => (width < 640 ? 0 : width < 1024 ? 1 : 2);

/** A card's place relative to the front (negative: left), wrapped round so the stack loops */
const wrapOffset = (d: number, total: number) => {
  const m = ((d % total) + total) % total;
  return m > total / 2 ? m - total : m;
};
const mod = (n: number, total: number) => ((n % total) + total) % total;

/**
 * A card's place in the stack as drawn. With two cards the back one rests on the right (wrapped into
 * -0.5 to 1.5, not -1 to 1, whose edge is exactly where it rests, so it would flicker out of sight)
 * and changes sides out of sight while the stack moves; otherwise as wrapOffset.
 */
const slotOffset = (d: number, total: number) => {
  if (total !== 2) return wrapOffset(d, total);
  const m = mod(d, 2);
  return m >= 1.5 ? m - 2 : m;
};
/** How visible a card is at that place: cards passing round the back fade out and in again */
const slotOpacity = (o: number, total: number) => {
  if (total === 2) return o > 1 ? Math.max(0, (1.5 - o) * 2) : o < 0 ? Math.max(0, (o + 0.5) * 2) : 1;
  const a = Math.abs(o);
  return a > total / 2 - 0.5 ? Math.max(0, (total / 2 - a) * 2) : 1;
};

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface PresetCarouselHandle {
  /** Moves the stack by n cards (negative: back) */
  go: (n: number) => void;
  /** Brings the preset to the front */
  bringToFront: (id: string) => void;
  /** Puts the focus on the front card */
  focusFront: () => void;
}

interface PresetCarouselProps {
  presets: Preset[];
  tags: Tag[];
  pickedId: string | null;
  /** The front card was tapped (or Enter / Space): pick it, or unpick it */
  onPick: (preset: Preset) => void;
  /** A card was held half a second, or its ⓘ pressed */
  onDetails: (preset: Preset) => void;
}

type SlotProps = {
  index: number;
  preset: Preset;
  tags: Tag[];
  isFront: boolean;
  picked: boolean;
  progress: MotionValue<number>;
  step: MotionValue<number>;
  total: MotionValue<number>;
  onCardClick: (index: number, clickCount: number) => void;
  onInfo: (preset: Preset) => void;
  cardRef?: (el: HTMLButtonElement | null) => void;
};

/**
 * One card with its label. Its place, tilt, size, darkness and layer order follow the stack's
 * position through motion values, so moving the stack changes the styles without redrawing it.
 */
const Slot = memo(function Slot({ index, preset, tags, isFront, picked, progress, step, total, onCardClick, onInfo, cardRef }: SlotProps) {
  const offset = useTransform<number, number>([progress, total], ([p, t]) => slotOffset(index - p, t));
  const x = useTransform<number, number>([offset, step], ([o, s]) => o * STEPS[s].x);
  const y = useTransform<number, number>([offset, step], ([o, s]) => (Math.abs(o) < 0.05 ? 0 : Math.abs(o) * STEPS[s].y));
  const rotate = useTransform<number, number>([offset, step], ([o, s]) => (Math.abs(o) < 0.05 ? 0 : o * STEPS[s].r));
  const scale = useTransform<number, number>([offset, step], ([o, s]) => 1 - Math.abs(o) * STEPS[s].s);
  const zIndex = useTransform(offset, (o) => Math.round(100 - Math.abs(o) * 10));
  // Cards more than half the stack away fade out (they pass behind on their way round)
  const opacity = useTransform<number, number>([offset, total], ([o, t]) => slotOpacity(o, t));
  const dim = useTransform(offset, (o) => Math.min(0.5, Math.abs(o) * 0.25));
  const labelOpacity = useTransform(dim, (d) => 1 - d);
  const tagList = presetTags(preset, tags);

  return (
    <motion.div data-slot={index} className="absolute" style={{ x, y, rotate, scale, zIndex, opacity }}>
      <div className="preset-slide-down grid justify-items-center gap-3" style={{ '--i': index } as CSSProperties}>
        <motion.div style={{ opacity: labelOpacity }} className="max-w-full">
          <PresetLabel tags={tagList} />
        </motion.div>
        <div className="relative">
          <PresetCard
            ref={cardRef}
            preset={preset}
            tags={tagList}
            picked={picked}
            tabIndex={isFront ? 0 : -1}
            aria-hidden={!isFront}
            aria-label={`${preset.name}${picked ? ', picked' : ''}`}
            onClick={(e) => onCardClick(index, e.detail)}
            onContextMenu={(e) => e.preventDefault()}
          >
            <motion.span className="pointer-events-none absolute inset-0 z-[4] bg-black" style={{ opacity: dim }} aria-hidden="true" />
          </PresetCard>
          {/* ⓘ: a button of its own next to the card, over its top right corner */}
          <button
            type="button"
            data-info
            tabIndex={isFront ? 0 : -1}
            aria-hidden={!isFront}
            aria-label={`Details of ${preset.name}`}
            title="Details"
            onClick={() => onInfo(preset)}
            className={`absolute right-2.5 top-2.5 z-[6] grid h-[30px] w-[30px] place-items-center rounded-full border-2 border-black bg-white text-black shadow-[2px_2px_0_#000] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4fc3f7] ${picked ? '-translate-y-2' : ''}`}
          >
            <Info size={16} strokeWidth={2.6} />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

/**
 * The stacked carousel: the front card in the middle, the others fanned to each side behind it,
 * looping. Drag or swipe sideways (a flick moves up to 3 cards), ‹ ›, ← → (from the layer) or tap a
 * card behind to bring cards to the front.
 */
export const PresetCarousel = forwardRef<PresetCarouselHandle, PresetCarouselProps>(function PresetCarousel(
  { presets, tags, pickedId, onPick, onDetails },
  ref
) {
  const count = presets.length;
  const progress = useMotionValue(0);
  const step = useMotionValue(stepFor(window.innerWidth));
  const total = useMotionValue(count);
  useEffect(() => total.set(Math.max(1, count)), [count, total]);
  useEffect(() => {
    const onResize = () => step.set(stepFor(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [step]);

  // The front card (React state only changes when another card reaches the front, not per frame)
  const [front, setFront] = useState(0);
  const frontRef = useRef(0);
  const updateFront = (p: number) => {
    const f = mod(Math.round(p), Math.max(1, count));
    if (f !== frontRef.current) {
      frontRef.current = f;
      setFront(f);
    }
  };
  useMotionValueEvent(progress, 'change', updateFront);
  useEffect(() => updateFront(progress.get()));

  const target = useRef(0);
  const springTo = (t: number) => {
    target.current = t;
    if (reducedMotion()) {
      progress.stop();
      progress.set(t);
    } else {
      animate(progress, t, { type: 'spring', stiffness: 260, damping: 30 });
    }
  };
  const go = (n: number) => springTo(Math.round(target.current) + n);
  const bringIndex = (i: number) => springTo(Math.round(target.current) + wrapOffset(i - target.current, count));

  const cardEls = useRef(new Map<number, HTMLButtonElement>());
  useImperativeHandle(ref, () => ({
    go,
    bringToFront: (id) => {
      const i = presets.findIndex((p) => p.id === id);
      if (i >= 0) bringIndex(i);
    },
    // The card coming to the front (the stack may still be moving there)
    focusFront: () => cardEls.current.get(mod(Math.round(target.current), Math.max(1, count)))?.focus(),
  }));

  // Dragging: the stack follows the finger; letting go springs to the nearest card. A tap right
  // after a drag does nothing; holding a card half a second opens its details.
  const areaRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; start: number; lastX: number; t: number; v: number; slot: number | null } | null>(null);
  const moved = useRef(false);
  const held = useRef(false);
  const holdTimer = useRef<number | null>(null);
  const clearHold = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };
  const presetsRef = useRef(presets);
  presetsRef.current = presets;
  const onDetailsRef = useRef(onDetails);
  onDetailsRef.current = onDetails;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      if (Math.abs(dx) > 6) {
        moved.current = true;
        clearHold();
      }
      const now = performance.now();
      d.v = (e.clientX - d.lastX) / Math.max(1, now - d.t);
      d.lastX = e.clientX;
      d.t = now;
      if (moved.current) progress.set(d.start - dx / STEPS[step.get()].sens);
    };
    const onUp = () => {
      const d = drag.current;
      if (!d) return;
      clearHold();
      drag.current = null;
      areaRef.current?.classList.remove('cursor-grabbing');
      if (!moved.current) return;
      const shift = Math.max(-3, Math.min(3, Math.round(progress.get() - d.start - d.v * 1.2)));
      springTo(Math.round(d.start) + shift);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      clearHold();
    };
    // springTo only reads refs and motion values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, step]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as Element).closest('[data-nav], [data-info]')) return;
    progress.stop();
    const slotEl = (e.target as Element).closest('[data-slot]');
    const slot = slotEl ? Number(slotEl.getAttribute('data-slot')) : null;
    drag.current = { x: e.clientX, start: progress.get(), lastX: e.clientX, t: performance.now(), v: 0, slot };
    moved.current = false;
    held.current = false;
    areaRef.current?.classList.add('cursor-grabbing');
    clearHold();
    if (slot !== null) {
      holdTimer.current = window.setTimeout(() => {
        holdTimer.current = null;
        held.current = true;
        const preset = presetsRef.current[slot];
        if (preset) onDetailsRef.current(preset);
      }, 500);
    }
  };

  const onCardClick = (i: number, clickCount: number) => {
    // A double click's second click does nothing: it unpicked the card the first one picked
    if (clickCount > 1) return;
    if (moved.current || held.current) {
      moved.current = false;
      held.current = false;
      return;
    }
    if (i !== frontRef.current) bringIndex(i);
    else onPick(presets[i]);
  };

  // A card was deleted or added: the front stays a real card
  useEffect(() => {
    if (count > 0 && frontRef.current >= count) springTo(count - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const frontPreset = presets[mod(front, Math.max(1, count))];

  return (
    <div
      ref={areaRef}
      className="relative h-full w-full cursor-grab touch-pan-y select-none overflow-hidden"
      onPointerDown={onPointerDown}
    >
      <div className="absolute inset-x-0 top-0 bottom-9 grid place-items-center">
        {presets.map((preset, i) => (
          <Slot
            key={preset.id}
            index={i}
            preset={preset}
            tags={tags}
            isFront={i === mod(front, Math.max(1, count))}
            picked={preset.id === pickedId}
            progress={progress}
            step={step}
            total={total}
            onCardClick={onCardClick}
            onInfo={onDetails}
            cardRef={(el) => {
              if (el) cardEls.current.set(i, el);
              else cardEls.current.delete(i);
            }}
          />
        ))}
      </div>
      <button
        type="button"
        data-nav
        onClick={() => go(-1)}
        aria-label="Previous preset"
        className="absolute left-[max(10px,calc(50%-480px))] top-1/2 z-[200] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border-2 border-primary bg-background text-primary shadow-[3px_3px_0_#000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ChevronLeft size={22} strokeWidth={3} />
      </button>
      <button
        type="button"
        data-nav
        onClick={() => go(1)}
        aria-label="Next preset"
        className="absolute right-[max(10px,calc(50%-480px))] top-1/2 z-[200] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border-2 border-primary bg-background text-primary shadow-[3px_3px_0_#000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ChevronRight size={22} strokeWidth={3} />
      </button>
      <p aria-live="polite" className="absolute bottom-2.5 left-1/2 z-[200] max-w-[90%] -translate-x-1/2 truncate text-xs font-bold text-muted-foreground">
        {frontPreset ? `${mod(front, count) + 1} of ${count}: ${frontPreset.name}` : ''}
      </p>
    </div>
  );
});
