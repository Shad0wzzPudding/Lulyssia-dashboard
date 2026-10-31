import { onlineManager } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { checklistProgress, toggleCheck } from '@/lib/checklist';

/**
 * A box ticked (or unticked) straight on a card: the item's description is saved at once with that
 * line changed. Offline it's refused with a message (a save made offline would wait and go through
 * later, unseen). `onAllTicked` runs when this tick completes the checklist.
 */
export const tickFromCard = (
  description: string,
  line: number,
  save: (description: string) => void,
  onAllTicked?: () => void
) => {
  if (!onlineManager.isOnline()) {
    toast.error("Couldn't save. Check your connection and try again.");
    return;
  }
  const next = toggleCheck(description, line);
  if (next === description) return;
  save(next);
  const before = checklistProgress(description);
  const after = checklistProgress(next);
  if (onAllTicked && after.total > 0 && after.done === after.total && before.done < before.total) onAllTicked();
};

/** After a task's last box: offers to mark the task done (ignoring it changes nothing). */
export const offerTaskDone = (title: string, markDone: () => void) =>
  toast(`All ticked: mark "${title}" done?`, {
    duration: 8000,
    action: { label: 'Mark done', onClick: markDone },
  });
