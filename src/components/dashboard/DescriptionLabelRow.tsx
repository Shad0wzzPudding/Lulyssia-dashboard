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
      <Button ref={ref} type="button" variant="outline" size="sm" className="h-7" onClick={onPresets}>
        <GalleryHorizontalEnd size={12} className="mr-1" />
        Presets
      </Button>
    </div>
  );
});
