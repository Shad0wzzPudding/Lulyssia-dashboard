import { NoticeBeforeToggle } from './NoticeBeforeToggle';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Event, FormSaveCallbacks, FormSaveMarker } from '@/lib/types';
import type { DeleteTarget, ReorderArgs } from '@/hooks/useDashboardData';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormattedTextarea } from '@/components/ui/formatted-textarea';
import { FormattedText } from '@/components/ui/formatted-text';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, ResizableDialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Clock, CalendarDays, Copy, Trash, Undo2, CheckSquare, Calendar, Hourglass } from 'lucide-react';
import { PageIcon } from './PageIcon';
import { format, parseISO, isAfter, isBefore, isToday, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { SelectModeOverlay } from './SelectionCorners';
import { cardSurface } from '@/lib/selectMode';
import { MultiSelectActionBar } from './MultiSelectActionBar';
import { LulyssiaConfirmDialog } from './LulyssiaConfirmDialog';
import { playSuccessSound, playCancelSound, playDeleteSound, playDuplicateSound, playUpdateSound, playEditSound, playAddSound, playSelectModeSound } from '@/lib/sounds';
import { TagPicker, TagChip } from './TagPicker';
import { AttachmentsField, AttachmentsChips, AttachmentsImages } from './AttachmentsField';
import { SortAndFilterBar } from './SortAndFilterBar';
import { type SortOption, sortItems, filterByTags, searchItems } from '@/lib/sortAndFilter';
import { useSortPreference } from '@/hooks/useSortPreference';
import { useBriefHold } from '@/hooks/useBriefHold';
import { useTags } from '@/hooks/useTags';
import { DragReorderList } from './DragReorderList';
import { CollapsiblePreview } from './CollapsiblePreview';
import { autoDeadline } from '@/lib/autoDeadline';

interface EventsPageProps {
  events: Event[];
  onCreateEvent: (data: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { __duplicate?: boolean; __silent?: boolean } & FormSaveMarker, options?: FormSaveCallbacks) => void;
  onUpdateEvent: (data: Partial<Event> & { id: string; __silent?: boolean } & FormSaveMarker, options?: FormSaveCallbacks) => void;
  onReorder: (args: ReorderArgs) => void;
  onDeleteEvent: (target: DeleteTarget) => void;
  /** The options let the page show Undo only once the clear has gone through */
  onClearPast: (ids: string[], options?: { onSuccess?: () => void }) => void;
  onRestoreEvents: (events: Event[]) => void;
}

export const EventsPage = ({ 
  events, 
  onCreateEvent, 
  onUpdateEvent, 
  onReorder,
  onDeleteEvent,
  onClearPast,
  onRestoreEvents
}: EventsPageProps) => {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // A file still uploading: saving waits, or the item would be saved without it
  const [uploading, setUploading] = useState(false);
  // A save sent from the form and not answered yet: the form waits for it ("Saving…"). The number
  // tells a late answer apart from the form opened since (closing the form lets go of the save).
  const [saving, setSaving] = useState(false);
  const saveRun = useRef(0);
  const closeForm = () => {
    saveRun.current += 1;
    setSaving(false);
    setIsCreateOpen(false);
  };
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clearedEvents, setClearedEvents] = useState<Event[]>([]);
  const [showUndo, setShowUndo] = useState(false);
  // After Undo, the Clear button comes back where Undo was: keep it out of reach for a second so a
  // double click on Undo can't open the "Clear …?" question again
  const [clearHeld, holdClear] = useBriefHold(1000);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    deadline: '',
    tag_ids: [] as string[],
    attachments: [] as import('@/lib/types').Attachment[],
    notice_before: false,
  });
  const [sort, setSort] = useSortPreference('events');
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const { tags } = useTags();
  const tagsById = useMemo(() => Object.fromEntries(tags.map((t) => [t.id, t])), [tags]);

  const { selectedIds, selectedCount, isSelecting, toggle, selectAll, keepOnly, clearSelection, enterSelectMode, isSelected } = useMultiSelect<Event>();

  const now = new Date();
  const visibleEvents = useMemo(
    // Date sorts use when an event starts (its deadline only if it has no start)
    () => sortItems(searchItems(filterByTags(events, filterTagIds), search), sort, tagsById, (e) => e.start_time ?? e.deadline),
    [events, filterTagIds, search, sort, tagsById]
  );
  // A search or tag filter that hides picked items also unpicks them
  useEffect(() => {
    keepOnly(visibleEvents);
  }, [visibleEvents, keepOnly]);
  const startOfToday = startOfDay(now);
  // Started on an earlier day and not over yet (its deadline is still ahead), like Home's "In progress..."
  const isInProgressEvent = (event: Event) =>
    !!event.start_time && !!event.deadline
    && isBefore(parseISO(event.start_time), startOfToday) && !isBefore(parseISO(event.deadline), now);
  // Over: started on an earlier day and ended (its deadline, or its start if it has none, has passed)
  const isPastEvent = (event: Event) =>
    !!event.start_time && isBefore(parseISO(event.start_time), startOfToday) && !isInProgressEvent(event);
  const inProgressEvents = visibleEvents.filter(isInProgressEvent);
  // Past events shown on the page (respects search and tag filters)
  const pastEvents = visibleEvents.filter(isPastEvent);
  // All past events, ignoring search/filters: what "Clear past events" deletes and Undo restores
  const allPastEvents = events.filter(isPastEvent);

  // Hide undo button after 10 seconds
  useEffect(() => {
    if (showUndo) {
      const timer = setTimeout(() => {
        setShowUndo(false);
        setClearedEvents([]);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showUndo]);

  const handleClearConfirm = () => {
    const cleared = allPastEvents;
    setShowClearConfirm(false);
    // Undo appears once the events are really gone, so it can't race the delete
    onClearPast(cleared.map((event) => event.id), {
      onSuccess: () => {
        setClearedEvents(cleared);
        setShowUndo(true);
        toast({
          title: "Events cleared! ✨",
          description: "You can undo this action within 10 seconds~",
        });
      },
    });
  };

  const handleUndo = () => {
    // The same events back (same ids, order and dates), not copies
    onRestoreEvents(clearedEvents);
    setShowUndo(false);
    setClearedEvents([]);
    holdClear();
    toast({
      title: "Events restored! 💠",
      description: "Lulyssia stole them back~",
    });
  };

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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading || saving) return;
    
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

  const handleCopy = (event: Event) => {
    onCreateEvent({
      title: event.title,
      description: event.description,
      start_time: event.start_time,
      deadline: event.deadline,
      tag_ids: event.tag_ids || [],
      attachments: event.attachments || [],
      notice_before: !!event.notice_before,
      __duplicate: true,
    });
    playDuplicateSound();
  };

  // Batch actions
  const handleBatchCopy = () => {
    // Each copy goes above the one made before it, so copy from the last to the first: the copies
    // keep the originals' order in "User sort" instead of coming out reversed
    const selected = sortItems(events.filter(e => selectedIds.has(e.id)), 'user').reverse();
    selected.forEach((event, idx) => {
      onCreateEvent({
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        deadline: event.deadline,
        tag_ids: event.tag_ids || [],
        attachments: event.attachments || [],
        notice_before: !!event.notice_before,
        __duplicate: true,
        __silent: idx !== selected.length - 1,
      });
    });
    playDuplicateSound();
    clearSelection();
  };

  const handleBatchDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmBatchDelete = () => {
    // Silent: the summary toast below replaces one toast per item
    selectedIds.forEach(id => onDeleteEvent({ id, __silent: true }));
    playDeleteSound();
    toast({ title: `${selectedCount} event(s) deleted` });
    clearSelection();
    setShowDeleteConfirm(false);
  };

  const handleCardClick = (event: Event) => {
    if (isSelecting) {
      toggle(event.id);
    }
  };

  const todayEvents = visibleEvents.filter(event => event.start_time && isToday(parseISO(event.start_time)));
  const upcomingEvents = visibleEvents.filter(event => !event.start_time || (isAfter(parseISO(event.start_time), now) && !isToday(parseISO(event.start_time))));

  const handleUserReorder = (orderedIds: string[], movedId: string) => {
    onReorder({ table: 'events', orderedIds, movedId });
  };

  const getEventStatus = (event: Event) => {
    if (!event.start_time) return 'upcoming';
    const eventDate = parseISO(event.start_time);
    if (isToday(eventDate)) return 'today';
    if (isAfter(eventDate, now)) return 'upcoming';
    if (isInProgressEvent(event)) return 'in_progress';
    return 'past';
  };

  // onLight: the card is white (outside select mode), so use deeper colors that stay readable
  const getStatusColor = (status: string, onLight = false) => {
    switch (status) {
      case 'today': return onLight ? 'text-amber-700' : 'text-amber-400 dark:text-amber-300';
      case 'upcoming': return onLight ? 'text-sky-700' : 'text-sky-400 dark:text-sky-300';
      case 'in_progress': return onLight ? 'text-violet-700' : 'text-violet-400 dark:text-violet-300';
      default: return onLight ? 'text-slate-600' : 'text-slate-400 dark:text-slate-300';
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'today': return 'border-amber-100 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10';
      case 'upcoming': return 'border-sky-100 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/10';
      case 'in_progress': return 'border-violet-100 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/10';
      default: return 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10';
    }
  };

  const renderEventCard = (event: Event, variant: 'today' | 'in_progress' | 'upcoming' | 'past') => {
    const status = getEventStatus(event);
    const todayBadge = (
      <Badge className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300">
        Today
      </Badge>
    );
    return (
      <Card 
        key={event.id} 
        className={`${getBorderColor(status)} relative transition-all flex flex-col h-full min-h-[200px] ${
          cardSurface(isSelecting, isSelected(event.id))
        } ${isSelected(event.id) ? 'ring-2 ring-events-theme shadow-lg' : ''}`}
        onClick={() => handleCardClick(event)}
      >
        {variant === 'today' ? (
          <CardContent className="p-4 flex-1">
            <div data-card-header className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {isSelecting && (
                  <Checkbox
                    checked={isSelected(event.id)}
                    onCheckedChange={() => toggle(event.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-lg [overflow-wrap:anywhere]">{event.title}</h4>
                  {/* On phones the badge sits under the title, leaving the title the row's width */}
                  {!isSelecting && <div className="mt-1 sm:hidden">{todayBadge}</div>}
                </div>
              </div>
              {!isSelecting && (
                <div data-card-actions className="flex items-center gap-2 shrink-0">
                  <div className="hidden sm:block">{todayBadge}</div>
                  <Button size="sm" variant="outline" onClick={() => handleCopy(event)} aria-label="Copy event" title="Copy">
                    <Copy size={12} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(event)} aria-label="Edit event" title="Edit">
                    <Edit size={12} />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => { playDeleteSound(); onDeleteEvent(event.id); }}
                    aria-label="Delete event"
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              )}
            </div>
            <div className="w-full mt-2">
                    {event.description && (
                      <p className="w-full text-sm text-muted-foreground whitespace-pre-wrap break-words max-h-32 overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}><FormattedText>{event.description}</FormattedText></p>
                   )}
                  {event.attachments && event.attachments.length > 0 && (
                    <div className="mt-2">
                      <AttachmentsImages attachments={event.attachments} />
                    </div>
                  )}
                  {event.attachments && event.attachments.length > 0 && (
                    <div className="mt-2">
                      <AttachmentsChips attachments={event.attachments} />
                    </div>
                  )}
                  <div className={`flex items-center gap-1 text-sm mt-2 ${getStatusColor(status, !isSelecting)}`}>
                    <Clock size={12} />
                    {event.start_time ? `${format(parseISO(event.start_time), 'HH:mm')} - Today` : 'No start time'}
                    {event.deadline && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        • Deadline: {format(parseISO(event.deadline), 'HH:mm')}
                      </span>
                    )}
                  </div>
                  {event.tag_ids && event.tag_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {event.tag_ids.map(id => tagsById[id] && <TagChip key={id} tag={tagsById[id]} />)}
                    </div>
                  )}
            </div>
          </CardContent>
        ) : (
          <>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                {isSelecting && (
                  <Checkbox
                    checked={isSelected(event.id)}
                    onCheckedChange={() => toggle(event.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                  />
                )}
                <CardTitle className={`min-w-0 [overflow-wrap:anywhere] text-${variant === 'past' ? 'base text-muted-foreground' : 'lg'}`}>{event.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3">
                {event.description && (
                  <p className="w-full text-sm text-muted-foreground whitespace-pre-wrap break-words max-h-32 overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}><FormattedText>{event.description}</FormattedText></p>
               )}
              <AttachmentsImages attachments={event.attachments} />
              <AttachmentsChips attachments={event.attachments} />
              <div className={`flex items-center gap-1 text-sm ${getStatusColor(status, !isSelecting)}`}>
                <Clock size={12} />
                {event.start_time ? format(parseISO(event.start_time), 'MMM dd, yyyy HH:mm') : 'No start time'}
                {event.deadline && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    • Deadline: {format(parseISO(event.deadline), 'MMM dd, HH:mm')}
                  </span>
                )}
              </div>
              {event.tag_ids && event.tag_ids.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {event.tag_ids.map(id => tagsById[id] && <TagChip key={id} tag={tagsById[id]} />)}
                </div>
              )}
              {!isSelecting && (
                <div data-card-actions className="flex items-center gap-2 pt-2 mt-auto">
                  <Button size="sm" variant="outline" onClick={() => handleCopy(event)} aria-label="Copy event" title="Copy">
                    <Copy size={12} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(event)} aria-label="Edit event" title="Edit">
                    <Edit size={12} />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => { playDeleteSound(); onDeleteEvent(event.id); }}
                    aria-label="Delete event"
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SelectModeOverlay visible={isSelecting} onExit={clearSelection} />
      {/* Lulyssia Confirmation Dialogs */}
      <LulyssiaConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        onConfirm={handleClearConfirm}
        title="Clear all past events?"
        description="This will permanently delete all events that have already ended. Events still in progress stay. But don't worry, you'll have 10 seconds to undo!"
        confirmText="Yep, clear them!"
        cancelText="Wait, no!"
      />
      <LulyssiaConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmBatchDelete}
        title={`Delete ${selectedCount} event(s)?`}
        description="This will permanently delete the selected events."
        confirmText="Yes, delete them!"
        cancelText="Wait, no!"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <PageIcon icon={Calendar} />
          <h2 className="p5-title w-fit text-2xl">
            My Events
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showUndo && (
            <Button 
              variant="outline"
              onClick={handleUndo}
              className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 hover:from-pink-200 hover:to-purple-200 animate-pulse"
            >
              <Undo2 size={16} className="mr-2" />
              Undo Clear
            </Button>
          )}
          {(pastEvents.length > 0 || clearHeld) && !showUndo && (
            <Button 
              variant="outline"
              onClick={() => setShowClearConfirm(true)}
              // While held: its space is kept (nothing around it moves), then it fades in
              aria-hidden={clearHeld || undefined}
              tabIndex={clearHeld ? -1 : undefined}
              className={`text-destructive hover:text-destructive transition-opacity duration-300 ${clearHeld ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
            >
              <Trash size={16} className="mr-2" />
              Clear Past
            </Button>
          )}
          {!isSelecting && events.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { playSelectModeSound(); enterSelectMode(); }}
            >
              <CheckSquare size={14} className="mr-2" />
              Select
            </Button>
          )}
          <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open && isCreateOpen) playCancelSound(); if (open) setIsCreateOpen(true); else closeForm(); }}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => { playAddSound(); resetForm(); }}
                className="bg-events-theme hover:bg-events-theme/80 text-white"
              >
                <Plus size={16} className="mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
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
              <Input
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
              <Input
                type="datetime-local"
                placeholder="Deadline (optional)"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              />
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
        </div>
      </div>

      {/* Event Statistics */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <Card className="text-center">
          <CardContent className="pt-6 px-1 sm:px-6">
            <div className="text-2xl font-bold text-amber-400 dark:text-amber-300">{todayEvents.length}</div>
            <div className="text-xs sm:text-sm text-muted-foreground truncate">Today</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6 px-1 sm:px-6">
            <div className="text-2xl font-bold text-violet-400 dark:text-violet-300">{inProgressEvents.length}</div>
            <div className="text-xs sm:text-sm text-muted-foreground truncate">In progress</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6 px-1 sm:px-6">
            <div className="text-2xl font-bold text-sky-400 dark:text-sky-300">{upcomingEvents.length}</div>
            <div className="text-xs sm:text-sm text-muted-foreground truncate">Upcoming</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6 px-1 sm:px-6">
            <div className="text-2xl font-bold text-slate-400 dark:text-slate-300">{pastEvents.length}</div>
            <div className="text-xs sm:text-sm text-muted-foreground truncate">Past</div>
          </CardContent>
        </Card>
      </div>

      {events.length > 0 && (
        <SortAndFilterBar
          sort={sort}
          onSortChange={setSort}
          filterTagIds={filterTagIds}
          onFilterChange={setFilterTagIds}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search events…"
          dateLabel="Start time"
        />
      )}

      {(() => {
        const renderSection = (
          items: Event[],
          variant: 'today' | 'in_progress' | 'upcoming' | 'past',
          gridClass: string
        ) =>
          sort === 'user' ? (
            <DragReorderList
              items={items}
              getId={(e) => e.id}
              onReorder={handleUserReorder}
              renderItem={(event) => renderEventCard(event, variant)}
            />
          ) : (
            <div className={gridClass}>
              {items.map((event) => renderEventCard(event, variant))}
            </div>
          );
        return (
          <>
            <div>
              <h3 className="text-lg font-semibold text-amber-400 dark:text-amber-300 mb-3 flex items-center gap-2">
                <CalendarDays size={16} />
                Today's Events ({todayEvents.length}){sort === 'user' ? ' — drag to arrange' : ''}
              </h3>
              {todayEvents.length > 0 ? (
                renderSection(todayEvents, 'today', 'space-y-3')
              ) : (
                <Card className="text-center py-8">
                  <CardContent>
                    <p className="text-muted-foreground">No events scheduled for today</p>
                  </CardContent>
                </Card>
              )}
            </div>
            {inProgressEvents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-violet-400 dark:text-violet-300 mb-3 flex items-center gap-2">
                  <Hourglass size={16} />
                  In Progress ({inProgressEvents.length}){sort === 'user' ? ' — drag to arrange' : ''}
                </h3>
                {renderSection(inProgressEvents, 'in_progress', 'grid gap-4 md:grid-cols-2')}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-sky-400 dark:text-sky-300 mb-3">
                Upcoming Events ({upcomingEvents.length}){sort === 'user' ? ' — drag to arrange' : ''}
              </h3>
              {renderSection(upcomingEvents, 'upcoming', 'grid gap-4 md:grid-cols-2')}
            </div>
            {pastEvents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-400 dark:text-slate-300 mb-3">
                  Past Events ({pastEvents.length}){sort === 'user' ? ' — drag to arrange' : ''}
                </h3>
                {sort === 'user' ? (
                  renderSection(pastEvents, 'past', '')
                ) : (
                  <CollapsiblePreview
                    items={pastEvents}
                    previewCount={3}
                    label="past events"
                    renderList={(items) => (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {items.map((event) => renderEventCard(event, 'past'))}
                      </div>
                    )}
                  />
                )}
              </div>
            )}
          </>
        );
      })()}

      {events.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">No events yet! Add your first event to get started.</p>
            <Button onClick={() => { playAddSound(); resetForm(); setIsCreateOpen(true); }}>
              <Plus size={16} className="mr-2" />
              Add Your First Event
            </Button>
          </CardContent>
        </Card>
      )}

      <MultiSelectActionBar
        selectedCount={selectedCount}
        onCopy={handleBatchCopy}
        onDelete={handleBatchDelete}
        onSelectAll={() => selectAll(visibleEvents)}
        totalCount={events.length}
      />
    </div>
  );
};
