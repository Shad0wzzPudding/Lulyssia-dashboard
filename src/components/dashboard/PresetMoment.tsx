import { useEffect, useRef, type CSSProperties } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { Preset, Tag } from '@/lib/types';
import { Dialog, DialogPortal } from '@/components/ui/dialog';
import { STICKERS } from '@/lib/stickers';
import { presetTags } from '@/lib/presets';
import { PresetButterflySymbol, PresetCard } from './PresetCard';

/** When the form is filled in under the moment, which then fades out (0.38s) */
const MOMENT_MS = 1250;
/**
 * The flames on the card: spread over its width and height (fixed, so every moment looks the same),
 * each rising, swelling and fading out, one after another from about 0.3s
 */
const FLAMES = Array.from({ length: 24 }, (_, i) => ({
  x: (i * 37 + 7) % 100,
  y: (i * 53) % 85,
  size: 28 + ((i * 17) % 26),
  drift: ((i * 29) % 21) - 10,
  delay: 0.28 + ((i * 3) % 8) * 0.08,
  duration: 0.5 + (i % 3) * 0.12,
}));

/**
 * After "Apply preset": Lulyssia holds the picked card up while it's engulfed in blue flame and burns away
 * from the bottom up.
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
            <div className="preset-moment-burn pointer-events-none relative z-[2] mb-[18vh]" aria-hidden="true">
              {/* The blaze behind the card, the card (charring and burning away), the glowing edge
                  that eats up it, and the flames over it */}
              <span className="preset-moment-blaze absolute -inset-[30%] rounded-full" />
              <PresetCard
                preset={preset}
                tags={presetTags(preset, tags)}
                tabIndex={-1}
                className="preset-moment-card relative !w-[min(60vw,230px)]"
              />
              <span className="preset-moment-ember absolute inset-0" />
              {FLAMES.map((f, i) => (
                <span
                  key={i}
                  className="preset-moment-flame absolute"
                  style={{
                    left: `${f.x}%`,
                    bottom: `${f.y}%`,
                    width: f.size,
                    height: f.size * 1.35,
                    '--drift': `${f.drift}px`,
                    animationDelay: `${f.delay}s`,
                    animationDuration: `${f.duration}s`,
                  } as CSSProperties}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={onEnd}
            className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[4] inline-flex min-h-11 items-center rounded-md bg-[hsl(0_0%_92%)] px-[18px] text-sm font-bold text-[#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Skip
          </button>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
