import { forwardRef } from 'react';
import { GalleryHorizontalEnd } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * The two rows over the task and event forms' description: "Preset card?" with "Presets" on the
 * right, then the "Description" label
 */
export const DescriptionLabelRow = forwardRef<HTMLButtonElement, { onPresets: () => void }>(function DescriptionLabelRow(
  { onPresets },
  ref
) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Preset card?</span>
        {/* Cyan like the plan's preview: cyan text and a faint cyan edge and fill */}
        <Button
          ref={ref}
          type="button"
          variant="outline"
          size="sm"
          className="h-7 border-primary/35 bg-primary/[0.08] px-2.5 text-xs font-bold text-primary hover:bg-primary/15 hover:text-primary"
          onClick={onPresets}
        >
          <GalleryHorizontalEnd size={14} strokeWidth={2.2} className="mr-1" />
          Presets
        </Button>
      </div>
      <label className="mb-1 block text-sm font-medium">Description</label>
    </>
  );
});
