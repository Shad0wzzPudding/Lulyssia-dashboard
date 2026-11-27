import { forwardRef } from 'react';
import { GalleryHorizontalEnd } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** The row over the task and event forms' description: "Description", and "Presets" on the right */
export const DescriptionLabelRow = forwardRef<HTMLButtonElement, { onPresets: () => void }>(function DescriptionLabelRow(
  { onPresets },
  ref
) {
  return (
    <div className="mb-1 flex items-center justify-between gap-2">
      <label className="text-sm font-medium">Description</label>
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
  );
});
