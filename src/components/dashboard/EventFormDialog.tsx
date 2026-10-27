import { forwardRef, useId, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { format, parseISO } from 'date-fns';
import { Event, FormSaveCallbacks, FormSaveMarker, Attachment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormattedTextarea } from '@/components/ui/formatted-textarea';
import { Dialog, ResizableDialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { playSuccessSound, playCancelSound, playUpdateSound, playEditSound } from '@/lib/sounds';
import { NoticeBeforeToggle } from './NoticeBeforeToggle';
import { TagPicker } from './TagPicker';
import { AttachmentsField } from './AttachmentsField';
import { autoDeadline } from '@/lib/autoDeadline';
import { END_BEFORE_START_MESSAGE, deadlineBeforeStart } from '@/lib/dateOrder';
import { refuseSaveOffline } from '@/lib/formSave';

/** Opens the form: empty for a new event, or filled in to edit one */
export interface EventFormHandle {
  openNew: () => void;
  openEdit: (event: Event) => void;
}

interface EventFormDialogProps {
  onCreateEvent: (data: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'> & FormSaveMarker, options?: FormSaveCallbacks) => void;
  onUpdateEvent: (data: Partial<Event> & { id: string } & FormSaveMarker, options?: FormSaveCallbacks) => void;
  /** The button that opens the empty form (the Events page's "Add Event") */
  trigger?: ReactNode;
}

/**
 * The event add/edit form, one for the whole app: the Events page and Home both use it, opened with
 * the handle's openNew / openEdit.
 */
export const EventFormDialog = forwardRef<EventFormHandle, EventFormDialogProps>(function EventFormDialog(
  { onCreateEvent, onUpdateEvent, trigger },
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
  const startId = useId();
  const endId = useId();
  const saveRun = useRef(0);
  const closeForm = () => {
    saveRun.current += 1;
    setSaving(false);
    setIsCreateOpen(false);
  };
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    deadline: '',
    tag_ids: [] as string[],
    attachments: [] as Attachment[],
    notice_before: false,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_time: '',
      deadline: '',
      tag_ids: [],
      attachments: [],
      notice_before: false,
    });
    setEditingEvent(null);
    setDateErrorShown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading || saving) return;
    if (deadlineBeforeStart(formData.start_time, formData.deadline)) {
      setDateErrorShown(true);
      return;
    }
    if (refuseSaveOffline(editingEvent ? 'Update' : 'Create')) return;

    const submissionData = {
      ...formData,
      start_time: formData.start_time ? new Date(formData.start_time).toISOString() : null,
      // null (not undefined) so clearing the deadline while editing really removes it
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
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
    if (editingEvent) {
      onUpdateEvent({ id: editingEvent.id, ...submissionData, __form: 'Update' }, callbacks);
      playUpdateSound();
    } else {
      onCreateEvent({ ...submissionData, __form: 'Create' }, callbacks);
      playSuccessSound();
    }
  };

  const handleEdit = (event: Event) => {
    playEditSound();
    setEditingEvent(event);
    setDateErrorShown(false);
    setFormData({
      title: event.title,
      description: event.description || '',
      start_time: event.start_time ? format(parseISO(event.start_time), "yyyy-MM-dd'T'HH:mm") : '',
      deadline: event.deadline ? format(parseISO(event.deadline), "yyyy-MM-dd'T'HH:mm") : '',
      tag_ids: event.tag_ids || [],
      attachments: event.attachments || [],
      notice_before: !!event.notice_before,
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
            {editingEvent ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Event title"
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
            <label htmlFor={startId} className="text-sm font-medium block">Start <span className="text-muted-foreground">(optional)</span></label>
            <Input
              id={startId}
              type="datetime-local"
              placeholder="Start time (optional)"
              value={formData.start_time}
              onChange={(e) => {
                const v = e.target.value;
                setFormData(prev => {
                  const next = { ...prev, start_time: v };
                  // The deadline follows the start (+5 h) until it is set by hand
                  if (v && (!prev.deadline || prev.deadline === autoDeadline(prev.start_time))) {
                    next.deadline = autoDeadline(v);
                  }
                  return next;
                });
              }}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={endId} className="text-sm font-medium block">End <span className="text-muted-foreground">(optional)</span></label>
            <Input
              id={endId}
              type="datetime-local"
              placeholder="End (optional)"
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              // Earliest choice: the start. The browser's own check would block saving with its
              // own bubble, so show the form's message instead
              min={formData.start_time || undefined}
              onInvalid={(e) => {
                if (!deadlineBeforeStart(formData.start_time, formData.deadline)) return;
                e.preventDefault();
                setDateErrorShown(true);
              }}
              aria-invalid={dateErrorShown && deadlineBeforeStart(formData.start_time, formData.deadline)}
            />
          </div>
          {dateErrorShown && deadlineBeforeStart(formData.start_time, formData.deadline) && (
            <p role="alert" className="-mt-2 text-sm text-destructive">{END_BEFORE_START_MESSAGE}</p>
          )}
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
              {uploading ? 'Uploading file…' : saving ? 'Saving…' : editingEvent ? 'Update' : 'Create'}
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
