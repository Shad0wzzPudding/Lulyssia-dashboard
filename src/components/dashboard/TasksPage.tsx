import { NoticeBeforeToggle } from './NoticeBeforeToggle';
import { useState, useEffect, useMemo } from 'react';
import { Task, DailyTask } from '@/lib/types';
import type { DeleteTarget, ReorderArgs } from '@/hooks/useDashboardData';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormattedTextarea } from '@/components/ui/formatted-textarea';
import { FormattedText } from '@/components/ui/formatted-text';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, ResizableDialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Clock, CheckCircle2, Circle, Calendar, CalendarClock, Copy, Trash, Undo2, X, CheckSquare, Repeat, Hourglass } from 'lucide-react';
import { PageIcon } from './PageIcon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { SelectModeOverlay } from './SelectionCorners';
import { cardSurface } from '@/lib/selectMode';
import { MultiSelectActionBar } from './MultiSelectActionBar';
import { LulyssiaConfirmDialog } from './LulyssiaConfirmDialog';
import { playSuccessSound, playCompletionSound, playCancelSound, playDeleteSound, playDuplicateSound, playUpdateSound, playEditSound, playAddSound, playSelectModeSound } from '@/lib/sounds';
import { TagPicker, TagChip } from './TagPicker';
import { AttachmentsField, AttachmentsChips, AttachmentsImages } from './AttachmentsField';
import { SortAndFilterBar } from './SortAndFilterBar';
import { type SortOption, sortItems, filterByTags, searchItems } from '@/lib/sortAndFilter';
import { useSortPreference } from '@/hooks/useSortPreference';
import { useBriefHold } from '@/hooks/useBriefHold';
import { useTags } from '@/hooks/useTags';
import { DragReorderList } from './DragReorderList';
import { CollapsiblePreview } from './CollapsiblePreview';
import { DailyTasksSection } from './DailyTasksSection';
import { autoDeadline } from '@/lib/autoDeadline';

type RecurrenceUnit = '' | 'day' | 'week' | 'month' | 'year';

interface TasksPageProps {
  tasks: Task[];
  onCreateTask: (data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { __duplicate?: boolean; __silent?: boolean }) => void;
  onUpdateTask: (data: Partial<Task> & { id: string; __silent?: boolean }) => void;
  onReorder: (args: ReorderArgs) => void;
  onDeleteTask: (target: DeleteTarget) => void;
  /** The options let the page show Undo only once the clear has gone through */
  onClearCompleted: (ids: string[], options?: { onSuccess?: () => void }) => void;
  onRestoreTasks: (tasks: Task[]) => void;
  dailyTasks: DailyTask[];
  dailyTasksStale: boolean;
  onCreateDailyTask: (data: Omit<DailyTask, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'task_date'>) => void;
  onUpdateDailyTask: (data: Partial<DailyTask> & { id: string; __silent?: boolean }) => void;
  onDeleteDailyTask: (id: string) => void;
  /** Set (a new number each time) to open the empty new-task form, e.g. from the "Add Task" shortcut */
  newTaskRequest?: number | null;
}

export const TasksPage = ({ 
  tasks, 
  onCreateTask, 
  onUpdateTask, 
  onReorder,
  onDeleteTask,
  onClearCompleted,
  onRestoreTasks,
  dailyTasks,
  dailyTasksStale,
  onCreateDailyTask,
  onUpdateDailyTask,
  onDeleteDailyTask,
  newTaskRequest = null,
}: TasksPageProps) => {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // A file still uploading: saving waits, or the item would be saved without it
  const [uploading, setUploading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clearedTasks, setClearedTasks] = useState<Task[]>([]);
  const [showUndo, setShowUndo] = useState(false);
  // After Undo, the Clear button comes back where Undo was: keep it out of reach for a second so a
  // double click on Undo can't open the "Clear …?" question again
  const [clearHeld, holdClear] = useBriefHold(1000);
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
    attachments: [] as import('@/lib/types').Attachment[],
    notice_before: false,
  });
  const [sort, setSort] = useSortPreference('tasks');
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const { tags } = useTags();
  const tagsById = useMemo(() => Object.fromEntries(tags.map((t) => [t.id, t])), [tags]);

  const { selectedIds, selectedCount, isSelecting, toggle, selectAll, keepOnly, clearSelection, enterSelectMode, isSelected } = useMultiSelect<Task>();

  // Hide undo button after 10 seconds
  useEffect(() => {
    if (showUndo) {
      const timer = setTimeout(() => {
        setShowUndo(false);
        setClearedTasks([]);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showUndo]);

  // What "Clear Completed" deletes: finished one-time tasks (repeating ones come back next round)
  const clearableTasks = tasks.filter(task => task.is_completed && !task.recurrence_unit);

  const handleClearConfirm = () => {
    const completed = clearableTasks;
    setShowClearConfirm(false);
    // Undo appears once the tasks are really gone, so it can't race the delete
    onClearCompleted(completed.map((task) => task.id), {
      onSuccess: () => {
        setClearedTasks(completed);
        setShowUndo(true);
        toast({
          title: "Tasks cleared! ✨",
          description: "You can undo this action within 10 seconds~",
        });
      },
    });
  };

  const handleUndo = () => {
    // The same tasks back (same ids, order and dates), not copies
    onRestoreTasks(clearedTasks);
    setShowUndo(false);
    setClearedTasks([]);
    holdClear();
    toast({
      title: "Tasks restored! 💠",
      description: "Lulyssia stole them back~",
    });
  };

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
  };

  // Asked from outside (the "Add Task" shortcut): open the empty new-task form
  useEffect(() => {
    if (newTaskRequest === null) return;
    resetForm();
    setIsCreateOpen(true);
  }, [newTaskRequest]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;
    
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

    if (editingTask) {
      // "Done" is only saved when it was changed in the form, so a tick made elsewhere (e.g. from
      // LINE) while the form was open isn't undone
      const { is_completed, ...rest } = submissionData;
      onUpdateTask({
        id: editingTask.id,
        ...rest,
        ...(is_completed !== editingTask.is_completed ? { is_completed } : {}),
      });
      playUpdateSound();
    } else {
      onCreateTask(submissionData);
      playSuccessSound();
    }
    
    resetForm();
    setIsCreateOpen(false);
  };

  const handleEdit = (task: Task) => {
    playEditSound();
    setEditingTask(task);
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

  const handleToggleComplete = (task: Task) => {
    const isCompleting = !task.is_completed;
    onUpdateTask({
      id: task.id,
      is_completed: isCompleting
    });
    if (isCompleting) {
      playCompletionSound();
    } else {
      playUpdateSound();
    }
  };

  const handleCopy = (task: Task) => {
    onCreateTask({
      title: task.title,
      description: task.description,
      start_date: task.start_date,
      deadline: task.deadline,
      is_completed: false,
      tag_ids: task.tag_ids || [],
      recurrence_unit: task.recurrence_unit || null,
      recurrence_interval: task.recurrence_interval || 1,
      recurrence_anchor: task.recurrence_anchor ?? null,
      attachments: task.attachments || [],
      notice_before: !!task.notice_before,
      __duplicate: true,
    });
    playDuplicateSound();
  };

  // Batch actions
  const handleBatchCopy = () => {
    // Each copy goes above the one made before it, so copy from the last to the first: the copies
    // keep the originals' order in "User sort" instead of coming out reversed
    const selected = sortItems(tasks.filter(t => selectedIds.has(t.id)), 'user').reverse();
    selected.forEach((task, idx) => {
      onCreateTask({
        title: task.title,
        description: task.description,
        start_date: task.start_date,
        deadline: task.deadline,
        is_completed: false,
        tag_ids: task.tag_ids || [],
        recurrence_unit: task.recurrence_unit || null,
        recurrence_interval: task.recurrence_interval || 1,
        recurrence_anchor: task.recurrence_anchor ?? null,
        attachments: task.attachments || [],
        notice_before: !!task.notice_before,
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
    selectedIds.forEach(id => onDeleteTask({ id, __silent: true }));
    playDeleteSound();
    toast({ title: `${selectedCount} task(s) deleted` });
    clearSelection();
    setShowDeleteConfirm(false);
  };

  const handleCardClick = (task: Task) => {
    if (isSelecting) {
      toggle(task.id);
    }
  };

  const now = new Date();
  const visibleTasks = useMemo(
    () => sortItems(searchItems(filterByTags(tasks, filterTagIds), search), sort, tagsById),
    [tasks, filterTagIds, search, sort, tagsById]
  );
  // A search or tag filter that hides picked items also unpicks them
  useEffect(() => {
    keepOnly(visibleTasks);
  }, [visibleTasks, keepOnly]);
  const pendingTasks = visibleTasks.filter(task => !task.is_completed);
  const completedTasks = visibleTasks.filter(task => task.is_completed);
  
  const overdueTasks = pendingTasks.filter(task => task.deadline && isBefore(parseISO(task.deadline), now));
  // In progress: started on an earlier day and not due yet (like Home's "In progress..." and the
  // Events page). Each unfinished task shows in one place: overdue, in progress or upcoming.
  const startOfToday = startOfDay(now);
  const isInProgressTask = (task: Task) =>
    !!task.start_date && !!task.deadline
    && isBefore(parseISO(task.start_date), startOfToday) && !isBefore(parseISO(task.deadline), now);
  const inProgressTasks = pendingTasks.filter(isInProgressTask);
  const upcomingTasks = pendingTasks.filter(task =>
    (!task.deadline || isAfter(parseISO(task.deadline), now)) && !isInProgressTask(task));

  const handleUserReorder = (orderedIds: string[], movedId: string) => {
    onReorder({ table: 'tasks', orderedIds, movedId });
  };

  const getTaskStatus = (task: Task) => {
    if (task.is_completed) return 'completed';
    if (task.deadline && isBefore(parseISO(task.deadline), now)) return 'overdue';
    return 'pending';
  };

  // onLight: the card is white (outside select mode), so use deeper colors that stay readable
  const getStatusColor = (status: string, onLight = false) => {
    switch (status) {
      case 'completed': return onLight ? 'text-emerald-700' : 'text-emerald-400 dark:text-emerald-300';
      case 'overdue': return onLight ? 'text-rose-600' : 'text-rose-400 dark:text-rose-300';
      default: return onLight ? 'text-sky-700' : 'text-sky-400 dark:text-sky-300';
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-emerald-100 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10';
      case 'overdue': return 'border-rose-100 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/10';
      default: return 'border-sky-100 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/10';
    }
  };

  const renderTaskCard = (task: Task, showBadge?: string) => {
    const badge = showBadge === 'overdue'
      ? <Badge variant="destructive" className="text-xs">Overdue</Badge>
      : showBadge === 'completed'
        ? <Badge className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300">Completed</Badge>
        : null;
    const status = getTaskStatus(task);
    return (
      <Card 
        key={task.id} 
        className={`${getBorderColor(status)} relative transition-all ${
          cardSurface(isSelecting, isSelected(task.id))
        } ${isSelected(task.id) ? 'ring-2 ring-upcoming-events shadow-lg' : ''}`}
        onClick={() => handleCardClick(task)}
      >
        <CardContent className="p-4">
          <div data-card-header className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {isSelecting ? (
                <Checkbox
                  checked={isSelected(task.id)}
                  onCheckedChange={() => toggle(task.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1"
                />
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleToggleComplete(task)}
                  aria-label={task.is_completed ? 'Mark as not done' : 'Mark as done'}
                  className="mt-1 p-0 h-6 w-6"
                >
                   {task.is_completed ? 
                     <CheckCircle2 size={20} className="text-emerald-400" /> : 
                     <Circle size={20} className="text-gray-400" />
                   }
                </Button>
              )}
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold [overflow-wrap:anywhere] ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </h4>
                {/* On phones the badge sits under the title, leaving the title the row's width */}
                {!isSelecting && badge && <div className="mt-1 sm:hidden">{badge}</div>}
              </div>
            </div>
            {!isSelecting && (
              <div data-card-actions className="flex items-center gap-2 shrink-0">
                {badge && <div className="hidden sm:block">{badge}</div>}
                <Button size="sm" variant="outline" onClick={() => handleCopy(task)} aria-label="Copy task" title="Copy">
                  <Copy size={12} />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(task)} aria-label="Edit task" title="Edit">
                  <Edit size={12} />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => { playDeleteSound(); onDeleteTask(task.id); }}
                  aria-label="Delete task"
                  title="Delete"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            )}
          </div>
          <div className="w-full mt-2">
                  {task.description && (
                    <p className="w-full text-sm text-muted-foreground whitespace-pre-wrap break-words max-h-32 overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}><FormattedText>{task.description}</FormattedText></p>
                  )}
                 {task.attachments && task.attachments.length > 0 && (
                   <div className="mt-2">
                     <AttachmentsImages attachments={task.attachments} />
                   </div>
                 )}
                 {task.attachments && task.attachments.length > 0 && (
                   <div className="mt-2">
                     <AttachmentsChips attachments={task.attachments} />
                   </div>
                 )}
                 <div className="space-y-1 mt-2">
                   {task.start_date ? (
                     <div className="flex items-center gap-1 text-sm text-muted-foreground">
                       <Calendar size={12} />
                       <span>Start: {format(parseISO(task.start_date), 'MMM dd, yyyy HH:mm')}</span>
                     </div>
                   ) : null}
                   <div className={`flex items-center gap-1 text-sm ${getStatusColor(status, !isSelecting)}`}>
                     <CalendarClock size={12} />
                     <span>Due: {task.deadline ? format(parseISO(task.deadline), 'MMM dd, yyyy HH:mm') : 'No deadline'}</span>
                   </div>
                 </div>
                 {task.tag_ids && task.tag_ids.length > 0 && (
                   <div className="flex flex-wrap gap-1 mt-2">
                     {task.tag_ids.map(id => tagsById[id] && <TagChip key={id} tag={tagsById[id]} />)}
                   </div>
                 )}
                 {task.recurrence_unit && (
                   <div className="mt-2">
                     <Badge variant="outline" className="repeat-badge text-xs">
                       <Repeat size={10} className="mr-1" />
                       Every {(task.recurrence_interval || 1) > 1 ? `${task.recurrence_interval} ` : ''}{task.recurrence_unit}{(task.recurrence_interval || 1) > 1 ? 's' : ''}
                     </Badge>
                   </div>
                 )}
          </div>
        </CardContent>
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
        title="Clear completed one-time tasks?"
        description="This will permanently delete all your completed one-time tasks. Repeating tasks stay and come back on their next round. But don't worry, you'll have 10 seconds to undo!"
        confirmText="Yep, clear them!"
        cancelText="Wait, no!"
      />
      <LulyssiaConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmBatchDelete}
        title={`Delete ${selectedCount} task(s)?`}
        description="This will permanently delete the selected tasks."
        confirmText="Yes, delete them!"
        cancelText="Wait, no!"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <PageIcon icon={CheckSquare} />
          <h2 className="p5-title w-fit text-2xl">
            My Tasks
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
          {(clearableTasks.length > 0 || clearHeld) && !showUndo && (
            <Button 
              variant="outline"
              onClick={() => setShowClearConfirm(true)}
              // While held: its space is kept (nothing around it moves), then it fades in
              aria-hidden={clearHeld || undefined}
              tabIndex={clearHeld ? -1 : undefined}
              className={`text-destructive hover:text-destructive transition-opacity duration-300 ${clearHeld ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
            >
              <Trash size={16} className="mr-2" />
              Clear Completed
            </Button>
          )}
          {!isSelecting && tasks.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { playSelectModeSound(); enterSelectMode(); }}
            >
              <CheckSquare size={14} className="mr-2" />
              Select
            </Button>
          )}
          <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open && isCreateOpen) playCancelSound(); setIsCreateOpen(open); }}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => { playAddSound(); resetForm(); }}
                className="bg-upcoming-events hover:bg-upcoming-events/80 text-white"
              >
                <Plus size={16} className="mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
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
                <Button type="submit" className="flex-1" disabled={uploading}>
                  {uploading ? 'Uploading file…' : editingTask ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { playCancelSound(); setIsCreateOpen(false); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </ResizableDialogContent>
        </Dialog>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <Card className="text-center">
          <CardContent className="pt-6 px-1 sm:px-6">
            <div className="text-2xl font-bold text-violet-400 dark:text-violet-300">{inProgressTasks.length}</div>
            <div className="text-xs sm:text-sm text-muted-foreground truncate">In progress</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6 px-1 sm:px-6">
            <div className="text-2xl font-bold text-sky-400 dark:text-sky-300">{upcomingTasks.length}</div>
            <div className="text-xs sm:text-sm text-muted-foreground truncate">Upcoming</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6 px-1 sm:px-6">
            <div className="text-2xl font-bold text-rose-400 dark:text-rose-300">{overdueTasks.length}</div>
            <div className="text-xs sm:text-sm text-muted-foreground truncate">Overdue</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6 px-1 sm:px-6">
            <div className="text-2xl font-bold text-emerald-400 dark:text-emerald-300">{completedTasks.length}</div>
            <div className="text-xs sm:text-sm text-muted-foreground truncate">Completed</div>
          </CardContent>
        </Card>
      </div>

      {tasks.length > 0 && (
        <SortAndFilterBar
          sort={sort}
          onSortChange={setSort}
          filterTagIds={filterTagIds}
          onFilterChange={setFilterTagIds}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search tasks…"
          showCompleted
        />
      )}

      {(() => {
        const renderSection = (items: Task[], badge?: string) =>
          sort === 'user' ? (
            <DragReorderList
              items={items}
              getId={(t) => t.id}
              onReorder={handleUserReorder}
              renderItem={(task) => renderTaskCard(task, badge)}
            />
          ) : (
            <div className="space-y-3">
              {items.map((task) => renderTaskCard(task, badge))}
            </div>
          );
        return (
          <>
            {overdueTasks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-rose-400 dark:text-rose-300 mb-3">
                  Overdue Tasks ({overdueTasks.length}){sort === 'user' ? ' — drag to arrange' : ''}
                </h3>
                {renderSection(overdueTasks, 'overdue')}
              </div>
            )}
            <DailyTasksSection
              dailyTasks={dailyTasks}
              stale={dailyTasksStale}
              onCreate={onCreateDailyTask}
              onUpdate={onUpdateDailyTask}
              onDelete={onDeleteDailyTask}
            />
            {inProgressTasks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-violet-400 dark:text-violet-300 mb-3 flex items-center gap-2">
                  <Hourglass size={16} />
                  In Progress ({inProgressTasks.length}){sort === 'user' ? ' — drag to arrange' : ''}
                </h3>
                {renderSection(inProgressTasks)}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-sky-400 dark:text-sky-300 mb-3">
                Upcoming Tasks ({upcomingTasks.length}){sort === 'user' ? ' — drag to arrange' : ''}
              </h3>
              {renderSection(upcomingTasks)}
            </div>
            {completedTasks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-emerald-400 dark:text-emerald-300 mb-3">
                  Completed Tasks ({completedTasks.length}){sort === 'user' ? ' — drag to arrange' : ''}
                </h3>
                {sort === 'user' ? (
                  renderSection(completedTasks, 'completed')
                ) : (
                  <CollapsiblePreview
                    items={completedTasks}
                    previewCount={1}
                    label="completed tasks"
                    renderList={(items) => renderSection(items, 'completed')}
                  />
                )}
              </div>
            )}
          </>
        );
      })()}

      {tasks.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">No tasks yet! Add your first task to get started.</p>
            <Button onClick={() => { playAddSound(); resetForm(); setIsCreateOpen(true); }}>
              <Plus size={16} className="mr-2" />
              Add Your First Task
            </Button>
          </CardContent>
        </Card>
      )}

      <MultiSelectActionBar
        selectedCount={selectedCount}
        onCopy={handleBatchCopy}
        onDelete={handleBatchDelete}
        onSelectAll={() => selectAll(visibleTasks)}
        totalCount={tasks.length}
      />
    </div>
  );
};
