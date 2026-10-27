import { forwardRef, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { format, parseISO } from 'date-fns';
import { X, Repeat } from 'lucide-react';
import { Task, FormSaveCallbacks, FormSaveMarker, Attachment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormattedTextarea } from '@/components/ui/formatted-textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, ResizableDialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { playSuccessSound, playCancelSound, playUpdateSound, playEditSound } from '@/lib/sounds';
import { NoticeBeforeToggle } from './NoticeBeforeToggle';
import { TagPicker } from './TagPicker';
import { AttachmentsField } from './AttachmentsField';
import { autoDeadline } from '@/lib/autoDeadline';
import { DEADLINE_BEFORE_START_MESSAGE, deadlineBeforeStart } from '@/lib/dateOrder';
import { refuseSaveOffline } from '@/lib/formSave';

type RecurrenceUnit = '' | 'day' | 'week' | 'month' | 'year';

/** Opens the form: empty for a new task, or filled in to edit one */
export interface TaskFormHandle {
  openNew: () => void;
  openEdit: (task: Task) => void;
}

interface TaskFormDialogProps {
  onCreateTask: (data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'> & FormSaveMarker, options?: FormSaveCallbacks) => void;
  onUpdateTask: (data: Partial<Task> & { id: string } & FormSaveMarker, options?: FormSaveCallbacks) => void;
  /** The button that opens the empty form (the Tasks page's "Add Task") */
  trigger?: ReactNode;
}

/**
 * The task add/edit form, one for the whole app: the Tasks page and Home both use it, opened with
 * the handle's openNew / openEdit.
 */
export const TaskFormDialog = forwardRef<TaskFormHandle, TaskFormDialogProps>(function TaskFormDialog(
  { onCreateTask, onUpdateTask, trigger },
  ref
) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // A file still uploading: saving waits, or the item would be saved without it
  const [uploading, setUploading] = useState(false);
  // A save sent from the form and not answered yet: the form waits for it ("Saving…"). The number
  // tells a late answer apart from the form opened since (closing the form lets go of the save).
  const [saving, setSaving] = useState(false);
  // "The deadline is before the start": shown once Create/Update was pressed with the dates that
  // way round, and gone as soon as they are fixed
  const [dateErrorShown, setDateErrorShown] = useState(false);
  const saveRun = useRef(0);
  const closeForm = () => {
    saveRun.current += 1;
    setSaving(false);
    setIsCreateOpen(false);
  };
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    deadline: '',
    is_completed: false,
    tag_ids: [] as string[],
    recurrence_unit: '' as RecurrenceUnit,
    // '' while the box is being retyped; saving turns it into a whole number of at least 1
    recurrence_interval: 1 as number | '',
    attachments: [] as Attachment[],
    notice_before: false,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_date: '',
      deadline: '',
      is_completed: false,
      tag_ids: [],
      recurrence_unit: '',
      recurrence_interval: 1,
      attachments: [],
      notice_before: false,
    });
    setEditingTask(null);
    setDateErrorShown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading || saving) return;
    if (deadlineBeforeStart(formData.start_date, formData.deadline)) {
      setDateErrorShown(true);
      return;
    }
    if (refuseSaveOffline(editingTask ? 'Update' : 'Create')) return;

    const deadline = formData.deadline ? new Date(formData.deadline).toISOString() : null;
    const recurrenceUnit = formData.recurrence_unit || null;
    const recurrenceInterval = formData.recurrence_unit ? Math.max(1, Math.round(Number(formData.recurrence_interval)) || 1) : 1;
    // A repeating task counts its repeats from its first deadline. Editing keeps that anchor
    // unless the deadline (to the minute) or the repeat setting changed.
    const minute = (iso?: string | null) => (iso ? Math.floor(new Date(iso).getTime() / 60000) : null);
    const keepAnchor = !!editingTask?.recurrence_anchor
      && minute(editingTask.deadline) === minute(deadline)
      && editingTask.recurrence_unit === recurrenceUnit
      && (editingTask.recurrence_interval || 1) === recurrenceInterval;
    const submissionData = {
      ...formData,
      // null (not undefined) so clearing a date while editing really removes it
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      deadline,
      recurrence_unit: recurrenceUnit,
      recurrence_interval: recurrenceInterval,
      recurrence_anchor: !recurrenceUnit ? null : keepAnchor ? (editingTask?.recurrence_anchor ?? deadline) : deadline,
    };

    // The form closes once the save went through; on a failure it stays open with everything kept
    const run = ++saveRun.current;
    setSaving(true);
    const callbacks: FormSaveCallbacks = {
      onSuccess: () => {
        if (saveRun.current !== run) return;
        closeForm();
        resetForm();
      },
      onError: () => {
        if (saveRun.current === run) setSaving(false);
      },
    };
    if (editingTask) {
      // "Done" is only saved when it was changed in the form, so a tick made elsewhere (e.g. from
      // LINE) while the form was open isn't undone
      const { is_completed, ...rest } = submissionData;
      onUpdateTask({
        id: editingTask.id,
        ...rest,
        ...(is_completed !== editingTask.is_completed ? { is_completed } : {}),
        __form: 'Update',
      }, callbacks);
      playUpdateSound();
    } else {
      onCreateTask({ ...submissionData, __form: 'Create' }, callbacks);
      playSuccessSound();
    }
  };

  const handleEdit = (task: Task) => {
    playEditSound();
    setEditingTask(task);
    setDateErrorShown(false);
    setFormData({
      title: task.title,
      description: task.description || '',
      start_date: task.start_date ? format(parseISO(task.start_date), "yyyy-MM-dd'T'HH:mm") : '',
      deadline: task.deadline ? format(parseISO(task.deadline), "yyyy-MM-dd'T'HH:mm") : '',
      is_completed: task.is_completed,
      tag_ids: task.tag_ids || [],
      recurrence_unit: (task.recurrence_unit as RecurrenceUnit) || '',
      recurrence_interval: task.recurrence_interval || 1,
      attachments: task.attachments || [],
      notice_before: !!task.notice_before,
    });
    setIsCreateOpen(true);
  };

  useImperativeHandle(ref, () => ({
    openNew: () => {
      resetForm();
      setIsCreateOpen(true);
    },
    openEdit: handleEdit,
  }));

  return (
    <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open && isCreateOpen) playCancelSound(); if (open) setIsCreateOpen(true); else closeForm(); }}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <ResizableDialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Task title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />
          <FormattedTextarea
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date <span className="text-muted-foreground">(optional)</span></label>
            <div className="flex gap-2 items-center">
              <Input
                type="datetime-local"
                placeholder="When task becomes active"
                value={formData.start_date}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData(prev => {
                    const next = { ...prev, start_date: v };
                    // The deadline follows the start (+5 h) until it is set by hand
                    if (v && (!prev.deadline || prev.deadline === autoDeadline(prev.start_date))) {
                      next.deadline = autoDeadline(v);
                    }
                    return next;
                  });
                }}
                className="flex-1 h-9 text-sm"
              />
              <button
                type="button"
                onClick={() => formData.start_date && setFormData(prev => ({ ...prev, start_date: '' }))}
                aria-label="Clear start date"
                className={`shrink-0 h-9 w-9 rounded-md border flex items-center justify-center transition-colors ${
                  formData.start_date 
                    ? 'bg-rose-500 border-rose-500 text-white hover:bg-rose-600 cursor-pointer' 
                    : 'bg-white dark:bg-background border-input cursor-default'
                }`}
              >
                {formData.start_date && <X size={16} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Deadline <span className="text-muted-foreground">(optional)</span></label>
            <div className="flex gap-2 items-center">
              <Input
                type="datetime-local"
                placeholder="When task is due"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                // Earliest choice: the start. The browser's own check would block saving with
                // its own bubble, so show the form's message instead
                min={formData.start_date || undefined}
                onInvalid={(e) => {
                  if (!deadlineBeforeStart(formData.start_date, formData.deadline)) return;
                  e.preventDefault();
                  setDateErrorShown(true);
                }}
                aria-invalid={dateErrorShown && deadlineBeforeStart(formData.start_date, formData.deadline)}
                className="flex-1 h-9 text-sm"
              />
              <button
                type="button"
                onClick={() => formData.deadline && setFormData(prev => ({ ...prev, deadline: '' }))}
                aria-label="Clear deadline"
                className={`shrink-0 h-9 w-9 rounded-md border flex items-center justify-center transition-colors ${
                  formData.deadline 
                    ? 'bg-rose-500 border-rose-500 text-white hover:bg-rose-600 cursor-pointer' 
                    : 'bg-white dark:bg-background border-input cursor-default'
                }`}
              >
                {formData.deadline && <X size={16} />}
              </button>
            </div>
            {dateErrorShown && deadlineBeforeStart(formData.start_date, formData.deadline) && (
              <p role="alert" className="text-sm text-destructive">{DEADLINE_BEFORE_START_MESSAGE}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <Repeat size={14} /> Task Type
            </label>
            <Select
              value={formData.recurrence_unit === '' ? 'one_time' : 'recurring'}
              onValueChange={(val) =>
                setFormData(prev => ({
                  ...prev,
                  recurrence_unit: val === 'one_time' ? '' : (prev.recurrence_unit || 'week'),
                }))
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_time">One-time task</SelectItem>
                <SelectItem value="recurring">Every X (recurring)</SelectItem>
              </SelectContent>
            </Select>
            {formData.recurrence_unit !== '' && (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">Every</span>
                <Input
                  type="number"
                  min={1}
                  value={formData.recurrence_interval}
                  // The box may be empty while a new number is typed (forcing 1 there turned "3" into "13");
                  // saving makes it a whole number of at least 1
                  onChange={(e) => setFormData(prev => ({ ...prev, recurrence_interval: e.target.value === '' ? '' : Number(e.target.value) }))}
                  className="w-20 h-9 text-sm"
                />
                <Select
                  value={formData.recurrence_unit}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, recurrence_unit: val as RecurrenceUnit }))}
                >
                  <SelectTrigger className="flex-1 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day(s)</SelectItem>
                    <SelectItem value="week">Week(s)</SelectItem>
                    <SelectItem value="month">Month(s)</SelectItem>
                    <SelectItem value="year">Year(s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {formData.recurrence_unit !== '' && !formData.deadline && (
              <p className="text-xs text-amber-500">Recurring tasks need a deadline to renew.</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_completed"
              checked={formData.is_completed}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_completed: !!checked }))}
            />
            <label htmlFor="is_completed" className="text-sm">Mark as completed</label>
          </div>
          <NoticeBeforeToggle checked={formData.notice_before} onChange={(v) => setFormData(prev => ({ ...prev, notice_before: v }))} />
          <div>
            <label className="text-sm font-medium mb-1 block">Tags</label>
            <TagPicker
              selected={formData.tag_ids}
              onChange={(ids) => setFormData(prev => ({ ...prev, tag_ids: ids }))}
            />
          </div>
          <AttachmentsField
            value={formData.attachments}
            onChange={(atts) => setFormData(prev => ({ ...prev, attachments: atts }))}
            onUploadingChange={setUploading}
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={uploading || saving}>
              {uploading ? 'Uploading file…' : saving ? 'Saving…' : editingTask ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={() => { playCancelSound(); closeForm(); }}>
              Cancel
            </Button>
          </div>
        </form>
      </ResizableDialogContent>
    </Dialog>
  );
});
