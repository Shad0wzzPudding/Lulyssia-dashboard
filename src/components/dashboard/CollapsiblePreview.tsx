import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Dialog, ResizableDialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props<T> {
  items: T[];
  /** How many stay fully visible when the list is one column (a wider grid keeps its first row) */
  previewCount: number;
  renderList: (items: T[]) => ReactNode;
  label?: string;
  /** Told how many items are on view (the rest are behind the "+N more" cover), whenever that changes */
  onShownChange?: (shown: number) => void;
}

// The cover lies on the next row from this far down it (its titles stay readable above)
const COVER_FROM = 0.25;

// A progressive blur: thin layers from light to strong, each fading in over the one before, so
// the cover goes from clear to fully covered with no visible bands (one blur behind a mask
// switches on in a step)
const BLUR_LAYERS = [0.5, 1, 2, 4, 8, 16];
const blurLayerMask = (i: number) => {
  const n = BLUR_LAYERS.length;
  const pct = (k: number) => `${Math.min(100, (k * 100) / n).toFixed(1)}%`;
  return i === n - 1
    ? `linear-gradient(to bottom, transparent ${pct(i)}, black ${pct(i + 1)})`
    : `linear-gradient(to bottom, transparent ${pct(i)}, black ${pct(i + 1)}, black ${pct(i + 2)}, transparent ${pct(i + 3)})`;
};

// The tint on top: many small eased steps (smoothstep) instead of three, from see-through to
// nearly solid card colour with a touch of cyan
const easedFade = (color: string, maxAlpha: number) => {
  const stops = Array.from({ length: 11 }, (_, k) => {
    const t = k / 10;
    const alpha = maxAlpha * t * t * (3 - 2 * t);
    return `hsl(var(${color}) / ${alpha.toFixed(3)}) ${k * 10}%`;
  });
  return `linear-gradient(to bottom, ${stops.join(', ')})`;
};
const COVER_TINT = `${easedFade('--primary', 0.35)}, ${easedFade('--card', 0.85)}`;

/**
 * Shows the first items as they are (the first row of a grid, or `previewCount` items in one
 * column), then the next row in full with a blurred cover over its lower part and a "+N more"
 * button that opens the full list. The cover never sits on the items that count as shown, and
 * with nothing beyond them there is no cover at all.
 */
export function CollapsiblePreview<T>({ items, previewCount, renderList, label = 'items', onShownChange }: Props<T>) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  // Measured from the real layout: how many are shown, and where the next row starts and ends
  const [layout, setLayout] = useState<{ shown: number; nextTop: number; nextBottom: number } | null>(null);

  // Enough for the shown items plus the peek of the next row (grids have at most `previewCount`
  // columns), so a long list isn't drawn in full just to be covered
  const rendered = items.slice(0, previewCount * 2);

  useLayoutEffect(() => {
    const box = listRef.current;
    const list = box?.firstElementChild as HTMLElement | null;
    if (!box || !list) return;
    const measure = () => {
      const cards = Array.from(list.children) as HTMLElement[];
      if (cards.length === 0) return;
      const boxTop = box.getBoundingClientRect().top;
      const rects = cards.map((c) => c.getBoundingClientRect());
      // Cards on the first row share its top (a grid); one per row means a single column
      const perRow = rects.filter((r) => Math.abs(r.top - rects[0].top) < 2).length;
      const shown = perRow > 1 ? perRow : previewCount;
      const next = rects.slice(shown, shown + perRow);
      const nextTop = next.length ? Math.round(Math.min(...next.map((r) => r.top)) - boxTop) : 0;
      const nextBottom = next.length ? Math.round(Math.max(...next.map((r) => r.bottom)) - boxTop) : 0;
      setLayout((prev) =>
        prev?.shown === shown && prev.nextTop === nextTop && prev.nextBottom === nextBottom
          ? prev
          : { shown, nextTop, nextBottom }
      );
    };
    measure();
    // Again when the width changes the row, or a picture loads and changes a card's height
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [items.length, previewCount]);

  // Until measured, and when everything fits, nothing is covered
  const hidden = layout ? Math.max(0, items.length - layout.shown) : 0;
  const covered = layout !== null && hidden > 0;
  const shownCount = items.length - hidden;
  useEffect(() => {
    onShownChange?.(shownCount);
  }, [shownCount, onShownChange]);

  return (
    <div className="relative">
      <div
        ref={listRef}
        className="overflow-hidden"
        style={covered ? { maxHeight: layout.nextBottom } : undefined}
      >
        {renderList(rendered)}
      </div>

      {covered && (
        // The whole next row: its cards are only a glimpse, so tapping anywhere on it opens the full
        // list instead of reaching a card's buttons under the blur
        // No isolation or clipping here: either one stops the browser from applying the blur
        // layers' fade-in masks, and the whole cover then blurs at full strength from its top edge
        <div
          className="absolute inset-x-0 bottom-0 z-10 cursor-pointer"
          style={{ top: layout.nextTop }}
          onClick={() => setOpen(true)}
        >
          <div className="absolute inset-x-0 bottom-0" style={{ top: `${COVER_FROM * 100}%` }}>
            {BLUR_LAYERS.map((px, i) => (
              <div
                key={px}
                className="absolute inset-0"
                style={{
                  backdropFilter: `blur(${px}px)`,
                  WebkitBackdropFilter: `blur(${px}px)`,
                  maskImage: blurLayerMask(i),
                  WebkitMaskImage: blurLayerMask(i),
                }}
              />
            ))}
            <div className="absolute inset-0" style={{ backgroundImage: COVER_TINT }} />
          </div>
          <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-center pb-1.5">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={`Show all ${items.length} ${label}`}
              title={`Show all ${items.length} ${label}`}
              className="inline-flex max-w-[90%] items-center gap-1 rounded-full border border-border bg-card px-[clamp(0.75rem,2vw,1.25rem)] py-1.5 text-[clamp(0.7rem,1.6vw,0.8rem)] font-medium text-muted-foreground shadow-md transition-all hover:scale-105 hover:text-foreground"
            >
              <MoreHorizontal size={16} />
              <span>+{hidden} more</span>
            </button>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <ResizableDialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">
              All {label} ({items.length})
            </DialogTitle>
          </DialogHeader>
          <div data-modal-list className="overflow-y-auto pr-1">{renderList(items)}</div>
        </ResizableDialogContent>
      </Dialog>
    </div>
  );
}
