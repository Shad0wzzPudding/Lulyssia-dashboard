import { checklistProgress } from '@/lib/checklist';
import { cn } from '@/lib/utils';

/**
 * Above an item's name: how far along its description's checklist is, as a thin bar and
 * "N / M done" (green when everything is ticked). Nothing when the description has no checklist.
 */
export const ChecklistProgress = ({ description, className }: { description?: string | null; className?: string }) => {
  const { done, total } = checklistProgress(description);
  if (total === 0) return null;
  const full = done === total;
  return (
    <div className={cn('flex items-center gap-2 text-xs font-semibold', full ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground', className)}>
      <div
        className="h-1.5 w-full max-w-[12rem] overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={`Checklist: ${done} of ${total} done`}
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-300', full ? 'bg-emerald-500' : 'bg-primary')}
          style={{ width: `${(done / total) * 100}%` }}
        />
      </div>
      <span className="whitespace-nowrap">{done} / {total} done</span>
    </div>
  );
};
