import { memo, useDeferredValue, useState, useEffect, useMemo, useRef } from 'react';
import { Task, DailyTask, FormSaveCallbacks, FormSaveMarker, Tag } from '@/lib/types';
import type { DeleteTarget, ReorderArgs } from '@/hooks/useDashboardData';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormattedText } from '@/components/ui/formatted-text';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Clock, CheckCircle2, Circle, Calendar, CalendarClock, Copy, Trash, Undo2, CheckSquare, Repeat, Hourglass } from 'lucide-react';
import { PageIcon } from './PageIcon';
import { format, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { SelectModeOverlay } from './SelectionCorners';
import { cardSurface } from '@/lib/selectMode';
import { MultiSelectActionBar } from './MultiSelectActionBar';
import { LulyssiaConfirmDialog } from './LulyssiaConfirmDialog';
import { playDeleteSound, playDuplicateSound, playAddSound, playSelectModeSound } from '@/lib/sounds';
import { TagChip } from './TagPicker';
import { AttachmentsChips, AttachmentsImages } from './AttachmentsField';
import { SortAndFilterBar } from './SortAndFilterBar';
import { type SortOption, sortItems, filterByTags, searchItems } from '@/lib/sortAndFilter';
import { useSortPreference } from '@/hooks/useSortPreference';
import { useBriefHold } from '@/hooks/useBriefHold';
import { HoldButton } from './HoldButton';
import { useTags } from '@/hooks/useTags';
import { DragReorderList } from './DragReorderList';
import { CollapsiblePreview } from './CollapsiblePreview';
import { DailyTasksSection } from './DailyTasksSection';
import { TaskFormDialog, type TaskFormHandle } from './TaskFormDialog';
import { SECTION_PAGE_SIZE, ShowMoreButton } from './ShowMoreButton';
import { notShownYetNote } from '@/lib/notShownYet';
import { toggleTaskDone } from '@/lib/taskDone';
import { offerTaskDone, tickFromCard } from '@/lib/checklistTick';
import { ChecklistProgress } from './ChecklistProgress';

interface TasksPageProps {
  tasks: Task[];
  onCreateTask: (data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { __duplicate?: boolean; __silent?: boolean } & FormSaveMarker, options?: FormSaveCallbacks) => void;
  onUpdateTask: (data: Partial<Task> & { id: string; __silent?: boolean } & FormSaveMarker, options?: FormSaveCallbacks) => void;
  onReorder: (args: ReorderArgs) => void;
  onDeleteTask: (target: DeleteTarget) => void;
  /** Select mode's Delete: all picked items in one go */
  onDeleteTasks: (ids: string[], options?: { onSuccess?: () => void }) => void;
  /** The options let the page show Undo only once the clear has gone through */
  onClearCompleted: (ids: string[], options?: { onSuccess?: () => void }) => void;
  onRestoreTasks: (tasks: Task[]) => void;
  dailyTasks: DailyTask[];
  dailyTasksStale: boolean;
  onCreateDailyTask: (data: Omit<DailyTask, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'task_date'> & FormSaveMarker, options?: FormSaveCallbacks) => void;
  onUpdateDailyTask: (data: Partial<DailyTask> & { id: string; __silent?: boolean } & FormSaveMarker, options?: FormSaveCallbacks) => void;
  onDeleteDailyTask: (id: string) => void;
  /** Set (a new number each time) to open the empty new-task form, e.g. from the "Add Task" shortcut */
  newTaskRequest?: number | null;
}

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


/** What a task card's buttons do. The object stays the same between renders (see TasksPage). */

type TaskCardActions = {
  cardClick: (task: Task) => void;
  toggleSelect: (id: string) => void;
  toggleComplete: (task: Task) => void;
  copy: (task: Task) => void;
  edit: (task: Task) => void;
  remove: (task: Task) => void;
  /** Ticks or unticks a checklist box in the task's description */
  tickCheck: (task: Task, line: number) => void;
};

type TaskCardProps = {
  task: Task;
  badge?: string;
  status: 'completed' | 'overdue' | 'pending';
  isSelecting: boolean;
  selected: boolean;
  tagsById: Record<string, Tag>;
  actions: TaskCardActions;
};

/**
 * One task card. Memoized: with many tasks, ticking or editing one (or typing in search) no longer
 * redraws every other card, only the cards whose task or state changed.
 */
const TaskCard = memo(function TaskCard({ task, badge, status, isSelecting, selected, tagsById, actions }: TaskCardProps) {
  const badgeEl = badge === 'overdue'
    ? <Badge variant="destructive" className="text-xs">Overdue</Badge>
    : badge === 'completed'
      ? <Badge className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300">Completed</Badge>
      : null;
  return (
    <Card 
      className={`${getBorderColor(status)} relative transition-all ${
        cardSurface(isSelecting, selected)
      } ${selected ? 'ring-2 ring-upcoming-events shadow-lg' : ''}`}
      onClick={() => actions.cardClick(task)}
    >
      <CardContent className="p-4">
        <div data-card-header className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {isSelecting ? (
              <Checkbox
                checked={selected}
                onCheckedChange={() => actions.toggleSelect(task.id)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1"
              />
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => actions.toggleComplete(task)}
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
              <ChecklistProgress description={task.description} className="mb-1" />
              <h4 className={`font-semibold whitespace-pre-wrap [overflow-wrap:anywhere] ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </h4>
              {/* On phones the badge sits under the title, leaving the title the row's width */}
              {!isSelecting && badgeEl && <div className="mt-1 sm:hidden">{badgeEl}</div>}
            </div>
          </div>
          {!isSelecting && (
            <div data-card-actions className="flex items-center gap-2 shrink-0">
              {badgeEl && <div className="hidden sm:block">{badgeEl}</div>}
              <Button size="sm" variant="outline" onClick={() => actions.copy(task)} aria-label="Copy task" title="Copy">
                <Copy size={12} />
              </Button>
              <Button size="sm" variant="outline" onClick={() => actions.edit(task)} aria-label="Edit task" title="Edit">
                <Edit size={12} />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => actions.remove(task)}
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
                  <p className="w-full text-sm text-muted-foreground whitespace-pre-wrap break-words max-h-32 overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}><FormattedText onToggleCheck={(line) => actions.tickCheck(task, line)}>{task.description}</FormattedText></p>
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
});

export const TasksPage = ({ 
  tasks, 
  onCreateTask, 
  onUpdateTask, 
  onReorder,
  onDeleteTask,
  onDeleteTasks,
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
  // The add/edit form (shared with Home)
  const taskForm = useRef<TaskFormHandle>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clearedTasks, setClearedTasks] = useState<Task[]>([]);
  const [showUndo, setShowUndo] = useState(false);
  // After Undo, the Clear button comes back where Undo was: keep it out of reach for 2 seconds so a
  // click running on from Undo can't open the "Clear …?" question again
  const [clearHeld, holdClear] = useBriefHold(2000);
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

  // Asked from outside (the "Add Task" shortcut): open the empty new-task form
  useEffect(() => {
    if (newTaskRequest === null) return;
    taskForm.current?.openNew();
  }, [newTaskRequest]);

  const handleEdit = (task: Task) => taskForm.current?.openEdit(task);

  const handleToggleComplete = (task: Task) => toggleTaskDone(task, onUpdateTask);

  // A checklist box ticked on a card: saved at once; ticking an unfinished task's last box offers
  // to mark the task done
  const handleTickCheck = (task: Task, line: number) =>
    tickFromCard(
      task.description || '',
      line,
      (description) => onUpdateTask({ id: task.id, description, __silent: true }),
      task.is_completed ? undefined : () => offerTaskDone(task.title, () => toggleTaskDone({ ...task, is_completed: false }, onUpdateTask))
    );

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
    // One request for all of them; the summary shows once it went through (a failure says so instead)
    const count = selectedCount;
    onDeleteTasks([...selectedIds], { onSuccess: () => toast({ title: `${count} task(s) deleted` }) });
    playDeleteSound();
    clearSelection();
    setShowDeleteConfirm(false);
  };

  const handleCardClick = (task: Task) => {
    if (isSelecting) {
      toggle(task.id);
    }
  };

  const now = new Date();
  // The search box updates right away; the (slower) list follows just after, so typing never waits
  // for every card to be redrawn
  const deferredSearch = useDeferredValue(search);
  const visibleTasks = useMemo(
    () => sortItems(searchItems(filterByTags(tasks, filterTagIds), deferredSearch), sort, tagsById),
    [tasks, filterTagIds, deferredSearch, sort, tagsById]
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

  // The cards' buttons, as one object that never changes: the cards can skip redrawing, and each
  // call still reaches the latest handlers
  const latestHandlers = useRef({ handleCardClick, toggle, handleToggleComplete, handleCopy, handleEdit, onDeleteTask, handleTickCheck });
  latestHandlers.current = { handleCardClick, toggle, handleToggleComplete, handleCopy, handleEdit, onDeleteTask, handleTickCheck };
  const cardActions = useMemo<TaskCardActions>(() => ({
    cardClick: (task) => latestHandlers.current.handleCardClick(task),
    toggleSelect: (id) => latestHandlers.current.toggle(id),
    toggleComplete: (task) => latestHandlers.current.handleToggleComplete(task),
    copy: (task) => latestHandlers.current.handleCopy(task),
    edit: (task) => latestHandlers.current.handleEdit(task),
    remove: (task) => {
      playDeleteSound();
      latestHandlers.current.onDeleteTask(task.id);
    },
    tickCheck: (task, line) => latestHandlers.current.handleTickCheck(task, line),
  }), []);

  // Long sections show 25 tasks at a time ("Show more" adds 25); back to 25 when the search,
  // tag filter or sort changes
  const [shownCounts, setShownCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    setShownCounts({});
  }, [deferredSearch, filterTagIds, sort]);
  // Picked tasks still behind a "Show more" ("All" picks them too): the delete question says so.
  // Only worked out while that question is open.
  const hiddenSelectedCount = showDeleteConfirm
    ? ([[overdueTasks, 'overdue'], [inProgressTasks, 'inProgress'], [upcomingTasks, 'upcoming']] as const)
        .reduce((count, [items, section]) =>
          count + items.slice(shownCounts[section] ?? SECTION_PAGE_SIZE).filter((task) => selectedIds.has(task.id)).length, 0)
    : 0;
  // Completed tasks folded under their "+N more" cover (every sort but "User sort") are picked by
  // "All" too: the delete question counts them as well. The cover says how many it shows.
  const [completedShown, setCompletedShown] = useState<number | null>(null);
  const completedFolded = sort === 'user' ? 0 : Math.max(0, completedTasks.length - (completedShown ?? completedTasks.length));
  const foldedSelectedCount = showDeleteConfirm && completedFolded > 0
    ? completedTasks.slice(completedTasks.length - completedFolded).filter((task) => selectedIds.has(task.id)).length
    : 0;
  const renderTaskCard = (task: Task, badge?: string) => (
    <TaskCard
      key={task.id}
      task={task}
      badge={badge}
      status={getTaskStatus(task)}
      isSelecting={isSelecting}
      selected={isSelected(task.id)}
      tagsById={tagsById}
      actions={cardActions}
    />
  );

  const handleUserReorder = (orderedIds: string[], movedId: string) => {
    onReorder({ table: 'tasks', orderedIds, movedId });
  };

  const getTaskStatus = (task: Task): TaskCardProps['status'] => {
    if (task.is_completed) return 'completed';
    if (task.deadline && isBefore(parseISO(task.deadline), now)) return 'overdue';
    return 'pending';
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
        description={`This will permanently delete the selected tasks${notShownYetNote(hiddenSelectedCount, foldedSelectedCount, `+${completedFolded} more`)}.`}
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
            // A long press: a quick or double click does nothing, so it can't run on into the Clear
            // button that comes back in its place
            <HoldButton
              variant="outline"
              onHold={handleUndo}
              hint="Hold to undo"
              title="Press and hold to undo"
              fillClassName="bg-pink-400/40"
              className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 hover:from-pink-200 hover:to-purple-200 animate-pulse"
            >
              <Undo2 size={16} className="mr-2" />
              Undo Clear
            </HoldButton>
          )}
          {(clearableTasks.length > 0 || clearHeld) && !showUndo && (
            <Button 
              variant="outline"
              onClick={() => setShowClearConfirm(true)}
              // While held: its space is kept (nothing around it moves), then it fades in
              aria-hidden={clearHeld || undefined}
              tabIndex={clearHeld ? -1 : undefined}
              className={`select-none text-destructive hover:text-destructive transition-opacity duration-300 ${clearHeld ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
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
          <TaskFormDialog
            ref={taskForm}
            onCreateTask={onCreateTask}
            onUpdateTask={onUpdateTask}
            trigger={
              <Button 
                onClick={() => { playAddSound(); taskForm.current?.openNew(); }}
                className="bg-upcoming-events hover:bg-upcoming-events/80 text-white"
              >
                <Plus size={16} className="mr-2" />
                Add Task
              </Button>
            }
          />
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
          searchPlaceholder="Search tasks… e.g. report, slides, !draft"
        />
      )}

      {(() => {
        // `section` names a list shown 25 at a time; without it (Completed) every item is shown
        const renderSection = (items: Task[], badge?: string, section?: string) => {
          const limit = section ? (shownCounts[section] ?? SECTION_PAGE_SIZE) : items.length;
          const shown = items.length > limit ? items.slice(0, limit) : items;
          const left = items.length - shown.length;
          return (
            <>
              {renderCards(shown, badge)}
              {left > 0 && section && (
                <ShowMoreButton
                  left={left}
                  onClick={() => setShownCounts((prev) => ({ ...prev, [section]: limit + SECTION_PAGE_SIZE }))}
                />
              )}
            </>
          );
        };
        const renderCards = (items: Task[], badge?: string) =>
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
                {renderSection(overdueTasks, 'overdue', 'overdue')}
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
                {renderSection(inProgressTasks, undefined, 'inProgress')}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-sky-400 dark:text-sky-300 mb-3">
                Upcoming Tasks ({upcomingTasks.length}){sort === 'user' ? ' — drag to arrange' : ''}
              </h3>
              {renderSection(upcomingTasks, undefined, 'upcoming')}
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
                    onShownChange={setCompletedShown}
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
            <Button onClick={() => { playAddSound(); taskForm.current?.openNew(); }}>
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
