import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { DailyTask, FormSaveCallbacks, FormSaveMarker } from '@/lib/types';
import { toast } from '@/lib/toast';
import { refuseSaveOffline } from '@/lib/formSave';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, ResizableDialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, ChevronDown, ChevronUp, Circle, Clock, Edit, Plus, Sun, Trash2 } from 'lucide-react';
import {
  playAddSound,
  playCancelSound,
  playCollapseSound,
  playCompletionSound,
  playDeleteSound,
  playEditSound,
  playExpandSound,
  playUpdateSound,
} from '@/lib/sounds';

type NewDailyTask = Omit<DailyTask, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'task_date'>;

interface DailyTasksSectionProps {
  dailyTasks: DailyTask[];
  /** Yesterday's list, still showing while today's loads: changes would go to yesterday's rows */
  stale: boolean;
  onCreate: (data: NewDailyTask & FormSaveMarker, options?: FormSaveCallbacks) => void;
  onUpdate: (data: Partial<DailyTask> & { id: string; __silent?: boolean } & FormSaveMarker, options?: FormSaveCallbacks) => void;
  onDelete: (id: string) => void;
}

const COLLAPSED_KEY = 'dailyTasksCollapsed';

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
};

// The database stores a time like "09:30:00"; the time input and the display use "09:30"
const toHHMM = (time?: string | null) => (time ? time.slice(0, 5) : '');

export const DailyTasksSection = ({ dailyTasks, stale, onCreate, onUpdate, onDelete }: DailyTasksSectionProps) => {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickTime, setQuickTime] = useState('');
  const [editing, setEditing] = useState<DailyTask | null>(null);
  const [form, setForm] = useState({ title: '', time: '', description: '' });
  // Quick add and the edit window keep what was typed until the save went through (and keep it
  // when it fails). The edit window's number tells a late answer apart from a window opened since.
  const [adding, setAdding] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const editRun = useRef(0);
  const closeEdit = () => {
    editRun.current += 1;
    setSavingEdit(false);
    setEditing(null);
  };

  // A new day's list loaded while a task's edit window was open: that task was yesterday's copy.
  // The window moves to today's copy (the day's list is copied by title), keeping what was typed
  // unsaved; with no such copy it closes without saving rather than change a list nobody sees
  useEffect(() => {
    if (!editing || stale) return;
    if (dailyTasks.some((task) => task.id === editing.id)) return;
    // Gone from the same day's list (deleted elsewhere) is not a new day
    if (dailyTasks.some((task) => task.task_date === editing.task_date)) return;
    const todays = dailyTasks.find((task) => task.title === editing.title);
    if (!todays) {
      closeEdit();
      toast("A new day started, so this edit wasn't saved. Open today's task to edit it.");
      return;
    }
    // A save still out for yesterday's copy can't close or change the moved window
    editRun.current += 1;
    setSavingEdit(false);
    setEditing(todays);
    toast("A new day started: your edit is now on today's task. Press Update to save it.");
  }, [dailyTasks, stale, editing]);

  const total = dailyTasks.length;
  const done = dailyTasks.filter((task) => task.is_completed).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const nowHHMM = format(new Date(), 'HH:mm');

  const handleOpenChange = (open: boolean) => {
    const nextCollapsed = !open;
    setCollapsed(nextCollapsed);
    if (nextCollapsed) playCollapseSound(); else playExpandSound();
    try {
      localStorage.setItem(COLLAPSED_KEY, String(nextCollapsed));
    } catch { /* storage unavailable */ }
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title || stale || adding) return;
    if (refuseSaveOffline('Add')) return;
    playAddSound();
    setAdding(true);
    onCreate({ title, deadline: quickTime || undefined, is_completed: false, __form: 'Add' }, {
      onSuccess: () => {
        setAdding(false);
        setQuickTitle('');
        setQuickTime('');
      },
      onError: () => setAdding(false),
    });
  };

  const handleToggle = (task: DailyTask) => {
    if (stale) return;
    const completing = !task.is_completed;
    onUpdate({ id: task.id, is_completed: completing, __silent: true });
    if (completing) playCompletionSound(); else playUpdateSound();
  };

  const handleEdit = (task: DailyTask) => {
    playEditSound();
    setForm({ title: task.title, time: toHHMM(task.deadline), description: task.description || '' });
    setEditing(task);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!editing || !title || stale || savingEdit) return;
    if (refuseSaveOffline('Update')) return;
    playUpdateSound();
    const run = ++editRun.current;
    setSavingEdit(true);
    onUpdate({
      id: editing.id,
      title,
      deadline: form.time || null,
      description: form.description.trim() || null,
      __form: 'Update',
    }, {
      onSuccess: () => {
        if (editRun.current === run) closeEdit();
      },
      onError: () => {
        if (editRun.current === run) setSavingEdit(false);
      },
    });
  };

  return (
    <div>
      <Collapsible open={!collapsed} onOpenChange={handleOpenChange}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={`flex w-full items-center justify-between gap-2 text-left ${collapsed ? '' : 'mb-3'}`}
          >
            <h3 className="text-lg font-semibold text-amber-400 dark:text-amber-300 flex items-center gap-2">
              <Sun size={18} />
              Daily Tasks{total > 0 ? ` (${done}/${total})` : ''}
            </h3>
            {collapsed ? <ChevronDown size={18} className="text-muted-foreground" /> : <ChevronUp size={18} className="text-muted-foreground" />}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {stale ? 'Loading today\'s list…' : `Resets every day · ${format(new Date(), 'EEE, d MMM')}`}
          </p>

          {total > 0 && (
            <div
              role="progressbar"
              aria-label="Daily tasks done"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            >
              <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${percent}%` }} />
            </div>
          )}

          {dailyTasks.map((task) => {
            const time = toHHMM(task.deadline);
            const late = !!time && !task.is_completed && time < nowHHMM;
            return (
              <Card
                key={task.id}
                className={`transition-all ${
                  task.is_completed
                    ? 'border-emerald-100 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10'
                    : 'border-amber-100 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10'
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggle(task)}
                        disabled={stale}
                        className="mt-0.5 p-0 h-6 w-6"
                        aria-label={task.is_completed ? 'Mark as not done' : 'Mark as done'}
                      >
                        {task.is_completed ? (
                          <CheckCircle2 size={20} className="text-emerald-400" />
                        ) : (
                          <Circle size={20} className="text-gray-400" />
                        )}
                      </Button>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold break-words ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h4>
                        {time && (
                          <span className={`mt-0.5 inline-flex items-center gap-1 text-xs ${late ? 'text-rose-400 dark:text-rose-300' : 'text-muted-foreground'}`}>
                            <Clock size={12} />
                            {time}
                          </span>
                        )}
                        {task.description && (
                          <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap break-words">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(task)} disabled={stale} aria-label="Edit daily task">
                        <Edit size={12} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { playDeleteSound(); onDelete(task.id); }}
                        disabled={stale}
                        className="text-destructive hover:text-destructive"
                        aria-label="Delete daily task"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {total === 0 && (
            <p className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">
              No daily tasks yet. Add things you do every day. They come back unchecked each morning.
            </p>
          )}

          <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
            <Input
              placeholder="Add a daily task…"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              aria-label="New daily task title"
              className="flex-1 min-w-0"
            />
            <Input
              type="time"
              value={quickTime}
              onChange={(e) => setQuickTime(e.target.value)}
              aria-label="Time (optional)"
              className="w-28 shrink-0 px-2 text-xs sm:text-sm"
            />
            <Button type="submit" size="sm" disabled={!quickTitle.trim() || stale || adding} aria-label={adding ? 'Saving…' : 'Add daily task'} className="shrink-0">
              <Plus size={16} />
            </Button>
          </form>
        </CollapsibleContent>
      </Collapsible>

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) closeEdit(); }}>
        <ResizableDialogContent>
          <DialogHeader>
            <DialogTitle>Edit Daily Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              placeholder="Task title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="daily-task-time">
                Time <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="daily-task-time"
                type="time"
                value={form.time}
                onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
              />
            </div>
            <Textarea
              placeholder="Notes (optional)"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={stale || savingEdit}>{savingEdit ? 'Saving…' : 'Update'}</Button>
              <Button type="button" variant="outline" onClick={() => { playCancelSound(); closeEdit(); }}>
                Cancel
              </Button>
            </div>
          </form>
        </ResizableDialogContent>
      </Dialog>
    </div>
  );
};
