-- Name system: what the app and Lulyssia call the user.
-- display_name: shown in the header and used for {name} in Lulyssia's lines and LINE messages.
-- nickname: what Lulyssia calls the user ({nickname}, replaces "Trailblazer").
-- Both are optional; null means "not set" (the app falls back to the other name or a default).
alter table public.user_preferences
  add column if not exists display_name text,
  add column if not exists nickname text;

alter table public.user_preferences
  drop constraint if exists user_preferences_display_name_check,
  add constraint user_preferences_display_name_check
    check (display_name is null or char_length(btrim(display_name)) between 1 and 40),
  drop constraint if exists user_preferences_nickname_check,
  add constraint user_preferences_nickname_check
    check (nickname is null or char_length(btrim(nickname)) between 1 and 40);
