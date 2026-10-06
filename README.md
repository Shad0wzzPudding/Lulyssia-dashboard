# Lulyssia Dashboard

A personal dashboard for tasks, events and interests, with a LINE bot that sends a morning digest,
start reminders and missed-deadline nudges.

## Features

- **Tasks** (one-time or recurring, with deadlines), **events** and **interests**
- Tags, file attachments, drag-to-reorder, sorting, tag filtering and search
- Activity log with the option to revert a deletion
- Daily tasks: a collapsible checklist on the Tasks page that comes back unchecked every day
- "Notice before" option: a heads-up the day before something starts
- LINE messages: daily digest (08:00 Thai time), start reminders, missed-deadline nudges
- Installable as an app (PWA)

## Tech stack

Vite, React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, and Supabase (Postgres, Auth,
Storage, Edge Functions, pg_cron). Notifications go through the LINE Messaging API.
The frontend is hosted on Vercel.

## Getting started

```sh
npm install
copy .env.example .env     # macOS/Linux: cp .env.example .env
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Development-mode build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |

### Frontend environment variables

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_PROJECT_ID` | Your Supabase project ref |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The project's **anon** (public) key |

These end up in the browser bundle by design. Data is protected by Row Level Security,
not by hiding the key. Never put a service-role key in a `VITE_` variable.

## Backend (Supabase)

### Database

All schema changes live in `supabase/migrations/` and replay cleanly on an empty database.
Every table has Row Level Security enabled and users can only access their own rows
(`auth.uid() = user_id`).

| Table | Purpose |
| --- | --- |
| `tasks`, `events`, `interests` | Main content, with tags and attachments |
| `tags` | Per-user tags (names are unique per user, ignoring case) |
| `activity_log` | Change history used for reverting deletions |
| `user_preferences` | Per-user settings |
| `line_links` | Link between an app user and a LINE account |
| `line_reminders_sent` | De-duplicates LINE reminders |
| `daily_tasks` | Daily checklist on the Tasks page (one row per task per day) |
| `daily_task_days` | Records which days were already set up, so deleted daily tasks never come back |

Attachments are stored in the private `attachments` storage bucket and served with signed URLs.

Daily tasks roll over through the `ensure_daily_tasks_for_today(user, local_date)` function, which the app
calls on load. The first call each day copies the previous list, unchecked. The day is the user's local
calendar day, not UTC.

### Edge functions (`supabase/functions/`)

| Function | Purpose | Who can call it |
| --- | --- | --- |
| `line-webhook` | LINE webhook: account linking by code and chat commands | LINE only (verifies the request signature) |
| `line-bot-info` | Returns the bot ID for the "Open LINE" button | Signed-in users |
| `line-rich-menu` | Creates the LINE rich menu from an uploaded image | Cron secret |
| `send-line-daily` | Daily digest and "notice before" message | Cron secret, or a signed-in user (test button) |
| `send-line-reminders` | Start reminders | Cron secret, or a signed-in user |
| `send-line-overdue` | Missed-deadline nudges | Cron secret |

Function secrets (Supabase Dashboard → Edge Functions → Secrets):

| Secret | Purpose |
| --- | --- |
| `LINE_CHANNEL_SECRET` | Verifies LINE webhook signatures |
| `LINE_CHANNEL_ACCESS_TOKEN` | Sends LINE messages |
| `LINE_CRON_SECRET` | Shared secret for scheduled calls |
| `CRON_SECRET` | Also accepted. **Keep it identical to `LINE_CRON_SECRET`, or delete it** |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Provided automatically by Supabase |

### Scheduled jobs

Jobs are created by migration `20261005000003_line_cron_vault.sql` using pg_cron and pg_net.

| Job | Schedule (UTC) | Meaning | Calls |
| --- | --- | --- | --- |
| `line-daily-digest-8am-bangkok` | `0 1 * * *` | 08:00 Thai time | `send-line-daily` |
| `line-overdue-nudges` | `0 * * * *` | Every hour | `send-line-overdue` |
| `line-start-reminders` | `*/5 * * * *` | Every 5 minutes | `send-line-reminders` |

The shared secret is **never stored in this repository**. The jobs read it from Supabase Vault at run
time, from a secret named `line_cron_secret`. To set it up for the first time, or to rotate it:

1. In the SQL Editor, generate a value: `select encode(gen_random_bytes(32), 'hex');`
2. Store it in Vault. First time: `select vault.create_secret('<value>', 'line_cron_secret');`
   When rotating, update the existing secret instead (Dashboard → Vault, or `vault.update_secret`).
3. Set `LINE_CRON_SECRET` to the same value in Edge Function secrets, and set `CRON_SECRET` to the
   same value or delete it.
4. Check that recent calls succeed (status 200, not 401):
   `select status_code, created from net._http_response order by created desc limit 5;`

Do not put the value in a migration, a commit, or a chat message.

## LINE setup

1. Create a Messaging API channel in the LINE Developers console.
2. Set its webhook URL to `https://<project-ref>.supabase.co/functions/v1/line-webhook` and enable it.
3. Add `LINE_CHANNEL_SECRET` and `LINE_CHANNEL_ACCESS_TOKEN` as function secrets (see above).
4. In the app, open **Settings**, add the bot as a friend, and send it the link code shown there.

Chat commands: `today`, `status`, `stop`, `start`, `remind on`, `remind off`, `overdue on`, `overdue off`.

A link code only works while its account is unlinked or being re-linked from the same LINE account.
To move to another LINE account, press the refresh button next to the code in Settings.

## Deployment

- **Frontend (Vercel):** `vercel.json` rewrites every path to `index.html`. It is required: without it,
  direct links such as `/auth` (including password-reset emails) return a 404.
  Set the three `VITE_` variables in the Vercel project settings.
- **Supabase Auth → URL Configuration:** set the Site URL to the production domain and add
  `https://<your-domain>/auth` to the Redirect URLs.
- Supabase's built-in email service is heavily rate limited. If sign-up or reset emails stop arriving,
  connect a custom SMTP provider.
- Pushed migrations have been applied to the database automatically. If one doesn't seem to take effect,
  run the file from `supabase/migrations/` in the SQL Editor.

## Security notes

- Row Level Security is the real protection for data, and each policy is limited to the `authenticated` role.
- Only the LINE webhook (service role) can set `line_user_id`, `display_name` and `linked_at` on `line_links`;
  a database trigger blocks users from setting them directly.
- Never commit secrets. If one leaks, rotate it and treat the old value as public forever, because git history is permanent.
