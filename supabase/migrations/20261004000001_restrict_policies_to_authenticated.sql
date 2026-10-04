-- Limit RLS policies to logged-in users (logged-out visitors never matched auth.uid() anyway)
alter policy "Users can create their own activity log entries" on public.activity_log to authenticated;
alter policy "Users can view their own activity log" on public.activity_log to authenticated;
alter policy "Users can delete their own activity log entries" on public.activity_log to authenticated;
alter policy "Users can manage their own daily tasks" on public.daily_tasks to authenticated;
alter policy "Users can manage their own events" on public.events to authenticated;
alter policy "Users can manage their own interests" on public.interests to authenticated;
alter policy "Users can manage their own subscriptions" on public.push_subscriptions to authenticated;
alter policy "Users can manage their own tasks" on public.tasks to authenticated;
alter policy "Users can manage their own tags" on public.tags to authenticated;