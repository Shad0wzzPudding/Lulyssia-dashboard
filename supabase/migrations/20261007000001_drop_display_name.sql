-- Name system simplified: the nickname is the only name the app and Lulyssia use,
-- so the separate display name is no longer needed.
alter table public.user_preferences
  drop constraint if exists user_preferences_display_name_check,
  drop column if exists display_name;
