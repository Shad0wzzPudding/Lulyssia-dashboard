import { ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Dialog, ResizableDialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props<T> {
  items: T[];
  /** How many stay fully visible when the list is one column (a wider grid keeps its first row) */
  previewCount: number;
  renderList: (items: T[]) => ReactNode;
  label?: string;
}

// How much of the next row peeks out under the cover
const PEEK_PX = 56;

/**
 * Shows the first items as they are (the first row of a grid, or `previewCount` items in one
 * column), then only a peek of the next row under a blurred cover with a "+N more" button that
 * opens the full list. The cover never sits on the items that count as shown, and with nothing
 * beyond them there is no cover at all.
 */
export function CollapsiblePreview<T>({ items, previewCount, renderList, label = 'items' }: Props<T>) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  // Measured from the real layout: how many are shown, and where they end
  const [layout, setLayout] = useState<{ shown: number; bottom: number } | null>(null);

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
      const bottom = Math.round(Math.max(...rects.slice(0, shown).map((r) => r.bottom)) - boxTop);
      setLayout((prev) => (prev?.shown === shown && prev.bottom === bottom ? prev : { shown, bottom }));
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

  return (
    <div className="relative">
      <div
        ref={listRef}
        className="overflow-hidden"
        style={covered ? { maxHeight: layout.bottom + PEEK_PX } : undefined}
      >
        {renderList(rendered)}
      </div>

      {covered && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 isolate overflow-hidden rounded-b-2xl"
          style={{ top: layout.bottom + 4 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/15 to-primary/40 backdrop-blur-[4px]" />
          <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 flex items-end justify-center pb-1.5">
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
