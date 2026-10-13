import { useRef } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Interest, Task, Event, ActivityLog, DailyTask } from '@/lib/types';
import { useLocalToday } from '@/hooks/useLocalToday';
import { sortItems } from '@/lib/sortAndFilter';
import { toast } from '@/lib/toast';
/**
 * What to delete: an id, or { id, __silent } to skip the success toast
 * (batch deletes show one summary toast of their own instead).
 */
export type DeleteTarget = string | { id: string; __silent?: boolean };
const deleteArgs = (target: DeleteTarget) =>
  typeof target === 'string' ? { id: target, __silent: false } : { id: target.id, __silent: !!target.__silent };

/** One drag in "User sort": the list's new order and the item that was dragged */
export interface ReorderArgs {
  table: 'interests' | 'tasks' | 'events';
  orderedIds: string[];
  movedId: string;
}

// Why an undo was refused, from revert_activity_log
const REVERT_REFUSED: Record<string, string> = {
  newer: 'Only the newest change to an item can be undone. Undo the newer one first.',
  not_found: 'That change was already undone or removed.',
  missing_data: 'This change has no saved copy to go back to.',
  unsupported: 'This kind of change cannot be undone.',
};

export const useDashboardData = () => {
  const queryClient = useQueryClient();

  // Interests
  const {
    data: interests = [],
    isLoading: interestsLoading,
    error: interestsError,
    isLoadingError: interestsLoadFailed,
    isRefetchError: interestsRefreshFailed
  } = useQuery({
    queryKey: ['interests'],
    queryFn: async (): Promise<Interest[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('interests')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return (data || []) as unknown as Interest[];
    }
  });

  // Tasks
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    error: tasksError,
    isLoadingError: tasksLoadFailed,
    isRefetchError: tasksRefreshFailed
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: async (): Promise<Task[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const loadTasks = async () => {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('deadline', { ascending: true });
        if (error) throw error;
        return (data || []) as unknown as Task[];
      };
      const tasks = await loadTasks();

      // Repeating tasks whose deadline has passed move to their next round. The database does it
      // (renew_my_recurring_tasks), with the same rule as the scheduled job, and keeps these
      // routine changes out of Recent Changes. Only asked when one is actually due.
      const now = Date.now();
      const renewalDue = tasks.some((t) => t.recurrence_unit && t.deadline && new Date(t.deadline).getTime() <= now);
      if (!renewalDue) return tasks;
      const { error: renewError } = await supabase.rpc('renew_my_recurring_tasks');
      if (renewError) {
        console.error('Error renewing repeating tasks:', renewError);
        return tasks;
      }
      return loadTasks();
    }
  });

  // Daily Tasks (the list belongs to the user's local calendar day)
  const today = useLocalToday();
  const {
    data: dailyTasks = [],
    isLoading: dailyTasksLoading,
    error: dailyTasksError,
    isLoadingError: dailyTasksLoadFailed,
    isRefetchError: dailyTasksRefreshFailed
  } = useQuery({
    queryKey: ['daily_tasks', today],
    // At midnight the key changes; keep showing the current list while the new day's
    // list loads, instead of the whole dashboard switching to the loading screen
    // (which also threw away anything typed into an open form).
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<DailyTask[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First, make sure today's list exists (copies the previous day's list, unchecked, once per day)
      const { error: ensureError } = await supabase.rpc('ensure_daily_tasks_for_today', {
        p_user_id: user.id,
        p_today: today
      });
      
      if (ensureError) {
        console.error('Error ensuring daily tasks for today:', ensureError);
      }

      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_date', today) // Only fetch today's daily tasks
        .order('deadline', { ascending: true }) // tasks without a time come last
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Events
  const {
    data: events = [],
    isLoading: eventsLoading,
    error: eventsError,
    isLoadingError: eventsLoadFailed,
    isRefetchError: eventsRefreshFailed
  } = useQuery({
    queryKey: ['events'],
    queryFn: async (): Promise<Event[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return (data || []) as unknown as Event[];
    }
  });

  // Activity Log
  const {
    data: activityLog = [],
    isLoading: activityLoading,
    error: activityError,
    isLoadingError: activityLoadFailed,
    isRefetchError: activityRefreshFailed
  } = useQuery({
    queryKey: ['activity_log'],
    queryFn: async (): Promise<ActivityLog[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return (data || []) as ActivityLog[];
    }
  });

  // "User sort": a new or copied item goes above the current first one (number 0 tied with the
  // top item and showed up second). Several created before the list reloads (a batch copy, or
  // quick adds) keep counting down from the last number handed out, so they don't tie.
  const lastTopSortOrder = useRef<Partial<Record<'interests' | 'tasks' | 'events', number>>>({});
  const topSortOrder = (table: 'interests' | 'tasks' | 'events') => {
    const items = queryClient.getQueryData<{ sort_order?: number }[]>([table]) ?? [];
    const fromList = items.length > 0 ? Math.min(...items.map((item) => item.sort_order ?? 0)) - 1 : 0;
    const last = lastTopSortOrder.current[table];
    const next = last === undefined ? fromList : Math.min(fromList, last - 1);
    lastTopSortOrder.current[table] = next;
    return next;
  };

  // Mutations
  const createInterest = useMutation({
    mutationFn: async (
      data: Omit<Interest, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { __duplicate?: boolean; __silent?: boolean }
    ) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const { __duplicate, __silent, ...insertData } = data;
      const { data: result, error } = await supabase
        .from('interests')
        .insert([{ ...insertData, sort_order: topSortOrder('interests'), user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return { result, __duplicate, __silent };
    },
    onSuccess: ({ __duplicate, __silent }) => {
      queryClient.invalidateQueries({ queryKey: ['interests'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      if (__silent) return;
      toast.success(__duplicate ? 'Interest duplicated!' : 'Interest created successfully!');
    },
    onError: (error) => {
      console.error('Failed to create interest:', error);
      toast.error('Failed to create interest. Please try again.');
    }
  });

  // __silent skips the success toast (used by batch pin/unpin, which shows one summary)
  const updateInterest = useMutation({
    mutationFn: async ({ id, __silent, ...data }: Partial<Interest> & { id: string; __silent?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from('interests')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return { result, __silent };
    },
    onSuccess: ({ __silent }) => {
      queryClient.invalidateQueries({ queryKey: ['interests'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      if (__silent) return;
      toast.success('Interest updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update interest:', error);
      toast.error('Failed to update interest. Please try again.');
    }
  });

  const deleteInterest = useMutation({
    mutationFn: async (target: DeleteTarget) => {
      const { id, __silent } = deleteArgs(target);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('interests')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return { __silent };
    },
    onSuccess: ({ __silent }) => {
      queryClient.invalidateQueries({ queryKey: ['interests'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      if (__silent) return;
      toast.success('Interest deleted successfully!');
    },
    onError: (error) => {
      console.error('Failed to delete interest:', error);
      toast.error('Failed to delete interest. Please try again.');
    }
  });

  const createTask = useMutation({
    mutationFn: async (
      data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { __duplicate?: boolean; __silent?: boolean }
    ) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const { __duplicate, __silent, ...insertData } = data;
      const { error } = await supabase
        .from('tasks')
        .insert([{ ...insertData, sort_order: topSortOrder('tasks'), user_id: user.id }]);
      
      if (error) throw error;
      return { __duplicate, __silent };
    },
    onSuccess: (meta) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      if (meta?.__silent) return;
      toast.success(meta?.__duplicate ? 'Task duplicated!' : 'Task created successfully!');
    },
    onError: (error) => {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task. Please try again.');
    }
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, __silent, ...data }: Partial<Task> & { id: string; __silent?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return { __silent };
    },
    onSuccess: ({ __silent }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      if (__silent) return;
      toast.success('Task updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task. Please try again.');
    }
  });

  const deleteTask = useMutation({
    mutationFn: async (target: DeleteTarget) => {
      const { id, __silent } = deleteArgs(target);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return { __silent };
    },
    onSuccess: ({ __silent }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      if (__silent) return;
      toast.success('Task deleted successfully!');
    },
    onError: (error) => {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task. Please try again.');
    }
  });

  const clearCompletedTasks = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', user.id)
        .eq('is_completed', true)
        // Ticked repeating tasks stay: they come back on their next round
        .is('recurrence_unit', null);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Completed tasks cleared!');
    },
    onError: (error) => {
      console.error('Failed to clear completed tasks:', error);
      toast.error('Failed to clear completed tasks. Please try again.');
    }
  });

  // Daily Task mutations
  const createDailyTask = useMutation({
    mutationFn: async (data: Omit<DailyTask, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'task_date'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('daily_tasks')
        .insert([{ ...data, user_id: user.id, task_date: today }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_tasks'] });
      toast.success('Daily task created successfully!');
    },
    onError: () => {
      toast.error('Failed to create daily task');
    }
  });

  const updateDailyTask = useMutation({
    mutationFn: async ({ id, __silent, ...data }: Partial<DailyTask> & { id: string; __silent?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('daily_tasks')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return { __silent };
    },
    // Show the change immediately (ticking a box should feel instant), undo it if saving fails
    onMutate: async ({ id, __silent, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ['daily_tasks'] });
      const previous = queryClient.getQueriesData<DailyTask[]>({ queryKey: ['daily_tasks'] });
      queryClient.setQueriesData<DailyTask[]>({ queryKey: ['daily_tasks'] }, (old) =>
        old?.map((task) => (task.id === id ? { ...task, ...data } : task))
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([key, value]) => queryClient.setQueryData<DailyTask[]>(key, value));
      toast.error('Failed to update daily task');
    },
    onSuccess: ({ __silent }) => {
      if (__silent) return;
      toast.success('Daily task updated successfully!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_tasks'] });
    }
  });

  const deleteDailyTask = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_tasks'] });
      toast.success('Daily task deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete daily task');
    }
  });

  const createEvent = useMutation({
    mutationFn: async (
      data: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { __duplicate?: boolean; __silent?: boolean }
    ) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const { __duplicate, __silent, ...insertData } = data;
      const { error } = await supabase
        .from('events')
        .insert([{ ...insertData, sort_order: topSortOrder('events'), user_id: user.id }]);
      
      if (error) throw error;
      return { __duplicate, __silent };
    },
    onSuccess: (meta) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      if (meta?.__silent) return;
      toast.success(meta?.__duplicate ? 'Event duplicated!' : 'Event created successfully!');
    },
    onError: (error) => {
      console.error('Failed to create event:', error);
      toast.error('Failed to create event. Please try again.');
    }
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, __silent, ...data }: Partial<Event> & { id: string; __silent?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('events')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return { __silent };
    },
    onSuccess: ({ __silent }) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      if (__silent) return;
      toast.success('Event updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update event:', error);
      toast.error('Failed to update event. Please try again.');
    }
  });

  const deleteEvent = useMutation({
    mutationFn: async (target: DeleteTarget) => {
      const { id, __silent } = deleteArgs(target);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return { __silent };
    },
    onSuccess: ({ __silent }) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      if (__silent) return;
      toast.success('Event deleted successfully!');
    },
    onError: (error) => {
      console.error('Failed to delete event:', error);
      toast.error('Failed to delete event. Please try again.');
    }
  });

  // Deletes exactly the events the Events page lists as past (it passes their ids).
  // Deleting by "start_time < now" also removed today's events that had already
  // started, which the page shows under Today and its Undo could not restore.
  const clearPastEvents = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      if (ids.length === 0) return;

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('user_id', user.id)
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Past events cleared!');
    },
    onError: (error) => {
      console.error('Failed to clear past events:', error);
      toast.error('Failed to clear past events. Please try again.');
    }
  });

  // Undo for "Clear Completed" / "Clear Past": puts the cleared items back exactly as they were
  // (same ids, order and dates), and removes their "deleted" entries from Recent Changes so
  // they can't be brought back a second time from there
  const restoreClearedItems = useMutation({
    mutationFn: async ({ table, items }: { table: 'tasks' | 'events'; items: (Task | Event)[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      if (items.length === 0) return;

      const { error } = await supabase
        .from(table)
        // Rows as they were read from this table
        .insert(items.map((item) => ({ ...item, user_id: user.id })) as never);
      if (error) throw error;

      const { error: logError } = await supabase
        .from('activity_log')
        .delete()
        .eq('user_id', user.id)
        .eq('action_type', 'deleted')
        .eq('item_type', table)
        .in('item_id', items.map((item) => item.id));
      if (logError) console.error('Failed to tidy Recent Changes after restoring:', logError);
    },
    onSettled: (_data, _error, { table }) => {
      queryClient.invalidateQueries({ queryKey: [table] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
    },
    onError: (error) => {
      console.error('Failed to restore cleared items:', error);
      toast.error('Failed to restore. You can still bring items back one by one from Recent Changes.');
    }
  });

  // Saves only the items whose number changes, then logs the drag once
  // (the log trigger skips updates that only change sort_order)
  const reorderItems = useMutation({
    mutationFn: async ({ table, orderedIds, movedId }: ReorderArgs) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const items = queryClient.getQueryData<{ id: string; title: string; created_at: string; sort_order?: number }[]>([table]) ?? [];
      const byId = new Map(items.map(item => [item.id, item]));

      // The dragged list may be only part of the whole (a search or tag filter,
      // or one section of the page). Put it back into the full list in its new
      // order and number the full list, so the other items keep their places.
      const dragged = orderedIds.filter(id => byId.has(id));
      const draggedSet = new Set(dragged);
      let next = 0;
      const fullOrder = sortItems(items, 'user').map(item => (draggedSet.has(item.id) ? dragged[next++] : item.id));
      const changed = fullOrder
        .map((id, index) => ({ id, from: byId.get(id)?.sort_order, to: index }))
        .filter(c => c.from !== c.to);
      if (changed.length === 0) return;

      const results = await Promise.all(
        changed.map(c =>
          supabase
            .from(table)
            .update({ sort_order: c.to })
            .eq('id', c.id)
            .eq('user_id', user.id)
        )
      );
      const failed = results.find(r => r.error);
      if (failed) throw failed.error;

      // Old numbers are kept so undo can put the whole list back
      const { error } = await supabase
        .from('activity_log')
        .insert({
          user_id: user.id,
          action_type: 'reordered',
          item_type: table,
          item_title: byId.get(movedId)?.title ?? 'Item',
          item_id: movedId,
          previous_data: { sort_orders: changed.map(c => ({ id: c.id, sort_order: c.from ?? 0 })) },
        });
      if (error) throw error;
    },
    onSettled: (_data, _error, { table }) => {
      queryClient.invalidateQueries({ queryKey: [table] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
    },
    onError: (error) => {
      console.error('Failed to save new order:', error);
      toast.error('Failed to save the new order. Please try again.');
    }
  });

  const deleteActivityLog = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('activity_log')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
    }
  });

  // Undo one Recent Changes entry. The database does it (revert_activity_log): it refuses when a
  // newer change to the same item exists, puts the item back without recording the undo (so the
  // next undo goes one more step back), and removes the entry.
  const revertActivityLog = useMutation({
    mutationFn: async (log: { id: string; action_type: string; item_type: string; item_id?: string; previous_data?: Record<string, unknown> }) => {
      const { data, error } = await supabase.rpc('revert_activity_log', { p_id: log.id });
      if (error) throw error;
      if (data !== 'ok') throw new Error(REVERT_REFUSED[data as string] ?? 'Failed to revert change.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interests'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['daily_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Change reverted successfully!');
    },
    onError: (error) => {
      console.error('Failed to revert change:', error);
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.error(Object.values(REVERT_REFUSED).includes(error.message) ? error.message : 'Failed to revert change. Please try again.');
    }
  });

  return {
    interests,
    tasks,
    dailyTasks,
    events,
    activityLog,
    isLoading: interestsLoading || tasksLoading || dailyTasksLoading || eventsLoading || activityLoading,
    // Only a list that never loaded is an error; a failed refresh keeps the data on screen
    error:
      (interestsLoadFailed && interestsError) || (tasksLoadFailed && tasksError) ||
      (dailyTasksLoadFailed && dailyTasksError) || (eventsLoadFailed && eventsError) ||
      (activityLoadFailed && activityError) || null,
    refreshFailed: interestsRefreshFailed || tasksRefreshFailed || dailyTasksRefreshFailed || eventsRefreshFailed || activityRefreshFailed,
    mutations: {
      createInterest,
      updateInterest,
      deleteInterest,
      createTask,
      updateTask,
      deleteTask,
      clearCompletedTasks,
      createDailyTask,
      updateDailyTask,
      deleteDailyTask,
      createEvent,
      updateEvent,
      deleteEvent,
      clearPastEvents,
      restoreClearedItems,
      reorderItems,
      deleteActivityLog,
      revertActivityLog,
    }
  };
};
