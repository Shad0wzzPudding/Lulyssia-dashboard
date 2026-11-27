import { useEffect, useRef, type CSSProperties } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { Preset, Tag } from '@/lib/types';
import { Dialog, DialogPortal } from '@/components/ui/dialog';
import { STICKERS } from '@/lib/stickers';
import { presetTags } from '@/lib/presets';
import { PresetButterflySymbol, PresetCard } from './PresetCard';

/** When the form is filled in under the moment, which then fades out (0.38s) */
const MOMENT_MS = 1250;
const SPARKS = Array.from({ length: 14 }, (_, s) => {
  const a = (s / 14) * Math.PI * 2;
  const r = 120 + (s % 3) * 40;
  return { dx: Math.cos(a) * r, dy: Math.sin(a) * r, delay: 0.35 + (s % 4) * 0.05 };
});

/**
 * After "Apply preset": Lulyssia holds the picked card up while it turns to light, with sparkles.
 * At 1.25s (or on "Skip" / Esc) `onEnd` fills the form, and the moment fades out over it.
 */
export const PresetMoment = ({ preset, tags, onEnd, onClosed }: {
  preset: Preset | null;
  tags: Tag[];
  /** Fill the form (once) */
  onEnd: () => void;
  /** The fade-out has finished */
  onClosed: () => void;
}) => {
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;
  useEffect(() => {
    if (!preset) return;
    const timer = window.setTimeout(() => onEndRef.current(), MOMENT_MS);
    return () => window.clearTimeout(timer);
  }, [preset]);

  return (
    <Dialog open={!!preset} onOpenChange={(o) => { if (!o) onEnd(); }}>
      <DialogPortal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="preset-moment fixed inset-0 z-50 grid place-items-center overflow-hidden outline-none bg-[radial-gradient(circle_at_50%_55%,hsl(193_40%_12%),#000_70%)]"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            onClosed();
          }}
        >
          <DialogPrimitive.Title className="sr-only">Applying the preset</DialogPrimitive.Title>
          <PresetButterflySymbol />
          <img
            src={STICKERS.ritualing}
            alt=""
            className="preset-moment-lulyssia absolute bottom-[4%] left-1/2 w-[min(62vw,340px)] -translate-x-1/2 drop-shadow-[0_0_30px_hsl(193_61%_52%/0.5)]"
          />
          {preset && (
            <PresetCard
              preset={preset}
              tags={presetTags(preset, tags)}
              tabIndex={-1}
              aria-hidden
              className="preset-moment-card pointer-events-none relative z-[2] mb-[18vh] !w-[min(60vw,230px)]"
            />
          )}
          {SPARKS.map((sp, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="preset-moment-spark pointer-events-none absolute left-[calc(50%-9px)] top-[calc(41%-9px)] z-[2] text-lg text-[#e0f7ff]"
              style={{ '--dx': `${sp.dx}px`, '--dy': `${sp.dy}px`, animationDelay: `${sp.delay}s` } as CSSProperties}
            >
              ✦
            </span>
          ))}
          <button
            type="button"
            onClick={onEnd}
            className="absolute bottom-4 right-4 z-[4] inline-flex min-h-11 items-center rounded-md bg-[hsl(0_0%_92%)] px-[18px] text-sm font-bold text-[#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Skip
          </button>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
