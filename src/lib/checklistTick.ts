import { toast } from '@/lib/toast';

/** After a task's last box: offers to mark the task done (ignoring it changes nothing). */
export const offerTaskDone = (title: string, markDone: () => void) =>
  toast(`All ticked: mark "${title}" done?`, {
    duration: 8000,
    action: { label: 'Mark done', onClick: markDone },
  });
