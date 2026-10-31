import { format, isAfter, parseISO } from 'date-fns';
import type { Task } from '@/lib/types';
import { toast as notify } from '@/lib/toast';
import { playCompletionSound, playUpdateSound } from '@/lib/sounds';

type UpdateTask = (data: Partial<Task> & { id: string; __silent?: boolean }) => void;

/**
 * A task's Done button: ticks it done (or back to not done), with its sound. A repeating task's tick
 * only finishes this round; its message offers to finish it for good. Used by the Tasks page's
 * cards and by the checklist's "mark done?" message.
 */
export const toggleTaskDone = (task: Task, onUpdateTask: UpdateTask) => {
  const isCompleting = !task.is_completed;
  // A repeating task's tick only finishes this round; its message offers to finish it for good
  const repeatingDone = isCompleting && !!task.recurrence_unit;
  onUpdateTask({
    id: task.id,
    is_completed: isCompleting,
    ...(repeatingDone ? { __silent: true } : {}),
  });
  if (isCompleting) {
    playCompletionSound();
  } else {
    playUpdateSound();
  }
  if (repeatingDone) {
    notify.success(
      // It comes back when this round's deadline passes; one already past (the app was open over
      // it) has no date to name: the next round starts as soon as the list refreshes
      task.deadline && isAfter(parseISO(task.deadline), new Date())
        ? `This round is done. "${task.title}" comes back on ${format(parseISO(task.deadline), 'MMM d, HH:mm')}.`
        : `This round of "${task.title}" is done.`,
      {
        duration: 8000,
        action: { label: 'Done for good', onClick: () => finishForGood(task, onUpdateTask) },
      }
    );
  }
};

// Stops a repeating task and keeps it as a completed one-time task (Clear Completed can clear it)
const finishForGood = (task: Task, onUpdateTask: UpdateTask) => {
  onUpdateTask({
    id: task.id,
    recurrence_unit: null,
    recurrence_interval: 1,
    recurrence_anchor: null,
    is_completed: true,
    __silent: true,
  });
  playCompletionSound();
  notify.success(`"${task.title}" is done for good. It won't repeat any more.`);
};
