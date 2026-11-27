import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type RefObject } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Check, GalleryHorizontalEnd, Plus } from 'lucide-react';
import type { Preset } from '@/lib/types';
import { usePresets } from '@/hooks/usePresets';
import { useTags } from '@/hooks/useTags';
import { Dialog, DialogPortal, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormattedText } from '@/components/ui/formatted-text';
import { STICKERS } from '@/lib/stickers';
import { playCancelSound, playEditSound, playExpandSound, playSuccessSound } from '@/lib/sounds';
import { presetDueLabel, presetTags } from '@/lib/presets';
import type { ApplyHow } from '@/lib/presetApply';
import { PresetButterflySymbol } from './PresetCard';
import { PresetCarousel, type PresetCarouselHandle } from './PresetCarousel';
import { PresetFormDialog, type PresetFormHandle } from './PresetFormDialog';
import { PresetDeleteDialog } from './PresetManager';
import { LulyssiaConfirmDialog } from './LulyssiaConfirmDialog';
import { TagChip } from './TagPicker';
import { PresetMoment } from './PresetMoment';

interface PresetPickerProps {
  open: boolean;
  /** A tap on the empty space around the cards, Esc, or after Apply: the layer closes */
  onClose: () => void;
  /** The form's description already has text: Apply asks first (add below or replace) */
  hasDescription: boolean;
  /** "Apply preset": fill the form (how: what to do with a description that has text) */
  onApply: (preset: Preset, how?: ApplyHow) => void;
  /** The "Presets" button: the focus goes back to it when the layer closes */
  returnFocusRef: RefObject<HTMLElement>;
}

/**
 * The full-screen "Choose 1 preset" layer over the task or event form: the stacked cards, "+" and
 * "Apply preset". A tap or click on its empty space (not a card, a button or the banner) fades it
 * out with no changes, as Esc does; nothing behind it can be used while it is open.
 */
export const PresetPicker = ({ open, onClose, hasDescription, onApply, returnFocusRef }: PresetPickerProps) => {
  const { presets, countUse } = usePresets();
  const { tags } = useTags();
  const carousel = useRef<PresetCarouselHandle>(null);
  const presetForm = useRef<PresetFormHandle>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Preset | null>(null);
  const [asking, setAsking] = useState<Preset | null>(null);
  // The apply moment playing (the layer has gone; the form is filled when it ends)
  const [moment, setMoment] = useState<{ preset: Preset; how?: ApplyHow } | null>(null);
  // Applied: the layer stays shut while the moment fades out over the form (until the form is told
  // the layer is closed), instead of coming back for that moment
  const [applied, setApplied] = useState(false);
  // A preset just made with "+": brought to the front once it is in the list
  const [bringId, setBringId] = useState<string | null>(null);

  // Each opening starts with nothing picked, the most used preset in front
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    setApplied(false);
    if (open) {
      setPickedId(null);
      setDetailsId(null);
      setAsking(null);
      setBringId(null);
    }
  }
  useEffect(() => {
    if (open) playExpandSound();
  }, [open]);

  // A deleted preset can't stay picked
  const picked = presets.find((p) => p.id === pickedId) ?? null;
  const details = presets.find((p) => p.id === detailsId) ?? null;

  useEffect(() => {
    if (!bringId || !presets.some((p) => p.id === bringId)) return;
    const id = bringId;
    setBringId(null);
    // Wait a frame so the new card is in the stack
    requestAnimationFrame(() => {
      carousel.current?.bringToFront(id);
      carousel.current?.focusFront();
    });
  }, [bringId, presets]);

  const close = () => {
    playCancelSound();
    onClose();
  };
  // Where the last press on the layer started: letting go after dragging the stack isn't a tap
  const pressAt = useRef<{ x: number; y: number } | null>(null);
  const tapOutside = (e: ReactMouseEvent) => {
    const start = pressAt.current;
    pressAt.current = null;
    if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) return;
    const target = e.target as HTMLElement;
    // The cards (with their labels and ⓘ), the banner and every button are the layer's own parts
    if (target.closest('[data-slot], .preset-banner, button, a, input, textarea')) return;
    close();
  };
  const togglePick = (preset: Preset) => {
    playEditSound();
    setPickedId((id) => (id === preset.id ? null : preset.id));
  };
  const apply = (preset: Preset, how?: ApplyHow) => {
    countUse(preset.id);
    playSuccessSound();
    // Reduced motion: no moment, the form is simply filled
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onApply(preset, how);
      onClose();
      return;
    }
    setMoment({ preset, how });
  };
  // The moment ends (at 1.25s, or "Skip" / Esc): the form is filled, then the moment fades out
  const endMoment = () => {
    if (!moment) return;
    onApply(moment.preset, moment.how);
    setApplied(true);
    setMoment(null);
  };
  const pressApply = () => {
    if (!picked) return;
    if (hasDescription && picked.description) setAsking(picked);
    else apply(picked);
  };
  // After a window over the layer closes, the focus comes back to the front card
  const refocus = () => requestAnimationFrame(() => carousel.current?.focusFront());

  return (
    <>
      <Dialog open={open && !moment && !applied} onOpenChange={(o) => { if (!o) close(); }}>
        <DialogPortal>
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="preset-layer fixed inset-0 z-50 grid grid-rows-[auto_minmax(0,1fr)_auto] bg-background/[0.94] text-foreground outline-none backdrop-blur-sm"
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              requestAnimationFrame(() => carousel.current?.focusFront());
            }}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              // During the apply moment the focus goes back once the moment has gone
              if (!moment && !applied) returnFocusRef.current?.focus();
            }}
            onPointerDown={(e) => { pressAt.current = { x: e.clientX, y: e.clientY }; }}
            onClick={tapOutside}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') { e.preventDefault(); carousel.current?.go(-1); }
              if (e.key === 'ArrowRight') { e.preventDefault(); carousel.current?.go(1); }
            }}
          >
            <PresetButterflySymbol />
            {/* The banner: slanted at its right end, a dark icon block, the title, a hint and "+". In the
                installed app on iPhone the page runs under the status bar (and the footer over the
                home bar), so they keep clear of them, as the forms do */}
            <div className="preset-banner flex items-center gap-3 bg-primary pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] pr-4 text-[#04151b] [clip-path:polygon(0_0,100%_0,calc(100%-14px)_100%,0_100%)]">
              <span className="grid self-stretch place-items-center bg-[#04151b] px-4 text-primary [clip-path:polygon(0_0,100%_0,calc(100%-10px)_100%,0_100%)]" aria-hidden="true">
                <GalleryHorizontalEnd size={22} />
              </span>
              <DialogPrimitive.Title className="text-[1.45rem] leading-none">Choose 1 preset</DialogPrimitive.Title>
              <span className="ml-auto hidden text-right text-xs font-semibold min-[600px]:block">Hold a card (or ⓘ) to read all of it</span>
              <button
                type="button"
                onClick={() => presetForm.current?.openNew()}
                aria-label="New preset"
                title="New preset"
                className="mr-2 grid h-9 w-9 flex-none place-items-center rounded-md border-2 border-[#04151b] max-[599px]:ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#04151b] focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>

            <div className="min-h-0">
              {presets.length > 0 ? (
                <PresetCarousel
                  ref={carousel}
                  presets={presets}
                  tags={tags}
                  pickedId={picked?.id ?? null}
                  onPick={togglePick}
                  onDetails={(p) => setDetailsId(p.id)}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                  <img src={STICKERS.contemplate} alt="Lulyssia thinking" className="h-36 w-36 object-contain" />
                  <p className="text-lg font-semibold">No presets yet. Make your first one!</p>
                  <Button onClick={() => presetForm.current?.openNew()}>
                    <Plus size={14} className="mr-1" />
                    New preset
                  </Button>
                </div>
              )}
            </div>

            {/* "Apply preset": in the middle on phones, on the right on wider screens */}
            <div className="flex justify-center gap-2.5 border-t border-primary/25 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:justify-end">
              <button
                type="button"
                onClick={pressApply}
                disabled={!picked}
                className="inline-flex min-h-11 items-center gap-2 bg-primary px-6 text-sm font-bold text-[#04151b] [clip-path:polygon(8px_0,100%_0,calc(100%-8px)_100%,0_100%)] disabled:cursor-default disabled:bg-[hsl(193_15%_30%)] disabled:text-[hsl(0_0%_60%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Check size={16} strokeWidth={3} />
                Apply preset
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>

      {/* The big card: everything about a preset, and pick / edit / delete it from here */}
      <Dialog open={!!details} onOpenChange={(o) => { if (!o) { setDetailsId(null); refocus(); } }}>
        <DialogContent className="max-w-sm">
          {details && (<>
            <DialogHeader>
              <DialogTitle className="text-2xl [overflow-wrap:anywhere] pr-6">{details.name}</DialogTitle>
              <DialogDescription className="sr-only">The preset's details</DialogDescription>
            </DialogHeader>
            {details.description ? (
              <div className="max-h-[40vh] overflow-y-auto rounded-md bg-muted/40 p-3 text-sm">
                <FormattedText>{details.description}</FormattedText>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No description format</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              {presetTags(details, tags).map((t) => <TagChip key={t.id} tag={t} />)}
              {presetTags(details, tags).length === 0 && <span className="text-xs text-muted-foreground">No tags</span>}
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{presetDueLabel(details)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  if (pickedId !== details.id) togglePick(details);
                  setDetailsId(null);
                  refocus();
                }}
              >
                Pick this one
              </Button>
              <Button variant="outline" onClick={() => { setDetailsId(null); presetForm.current?.openEdit(details); }}>Edit</Button>
              <Button variant="outline" className="text-destructive" onClick={() => { setDetailsId(null); setDeleting(details); }}>Delete</Button>
              <Button variant="ghost" onClick={() => { setDetailsId(null); refocus(); }}>Close</Button>
            </div>
          </>)}
        </DialogContent>
      </Dialog>

      <PresetMoment
        preset={moment?.preset ?? null}
        tags={tags}
        onEnd={endMoment}
        onClosed={() => {
          onClose();
          requestAnimationFrame(() => returnFocusRef.current?.focus());
        }}
      />
      <PresetFormDialog
        ref={presetForm}
        onSaved={(preset) => {
          // A new preset comes to the front; an edited one shows its changes in place
          if (!presets.some((p) => p.id === preset.id)) setBringId(preset.id);
          else refocus();
        }}
      />
      <PresetDeleteDialog
        preset={deleting}
        onClose={() => { setDeleting(null); refocus(); }}
        onDeleted={(p) => { if (pickedId === p.id) setPickedId(null); }}
      />
      <LulyssiaConfirmDialog
        open={!!asking}
        onOpenChange={(o) => { if (!o) setAsking(null); }}
        title="The description already has text."
        description={asking ? `Add "${asking.name}" below it, or replace it?` : ''}
        confirmText="Add below"
        secondaryText="Replace"
        cancelText="Cancel"
        onConfirm={() => {
          const p = asking;
          setAsking(null);
          if (p) apply(p, 'add');
        }}
        onSecondary={() => {
          const p = asking;
          setAsking(null);
          if (p) apply(p, 'replace');
        }}
      />
    </>
  );
};
