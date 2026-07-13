# Tasks persistence & sync foundation

The Tasks module is the first feature migrated from mock/local state to real,
per-user Supabase persistence. It is also the **reference pattern** for migrating
Projects, Calendar, and Bank later.

## Data flow

```
TasksPage.vue / TodayTasksCard.vue
        │  (uses composable, never Supabase directly)
        ▼
useTasks()  ──►  tasks.store.ts  ──►  tasks.service.ts  ──►  Supabase
 (UX glue)        (state + realtime      (typed queries,
                   + optimistic)          validation, errors)
```

Files:

| Layer | File |
|-------|------|
| Types / mapping | `src/modules/tasks/types/task.types.ts` |
| Service | `src/modules/tasks/services/tasks.service.ts` |
| Store | `src/modules/tasks/stores/tasks.store.ts` |
| Composable | `src/modules/tasks/composables/useTasks.ts` |
| Sync badge | `src/components/shared/DataSyncStatus.vue` |
| Migration | `supabase/migrations/202607130003_tasks.sql` |

> The requested `src/modules/tasks/components/` and `utils/` folders were **not**
> created — the page and its UI already live in `src/pages/TasksPage.vue` and
> `src/components/ui/*`, so empty folders would be dead scaffolding. Add them when
> there is real module-local code to put in them.

## Migration setup

Apply `supabase/migrations/202607130003_tasks.sql` to your Supabase project:

- **Supabase CLI:** `supabase db push` (or `supabase migration up`).
- **Dashboard:** paste the file contents into the SQL editor and run it.

The migration is idempotent (`create table if not exists`, `drop policy if exists`,
guarded publication add) so it is safe to re-run.

It reuses the existing `public.set_updated_at()` trigger function from
`202607130001_personal_knowledge_system.sql` — no duplicate function is created.

### Schema note: `project`

The original column spec did not include a project field, but the Tasks UI edits
and displays one, so a nullable `project text` column was added to preserve the
existing UX. It is free text, capped at 120 chars.

## Row Level Security

RLS is **enabled** and every policy keys on `auth.uid() = user_id`:

- `select` — a user reads only their own tasks.
- `insert` — `with check (auth.uid() = user_id)`; a client cannot insert a row for
  someone else even if it forges `user_id`.
- `update` / `delete` — restricted to owned rows.

`user_id` is **never** taken from the form. The service derives it from the
authenticated session (`supabase.auth.getUser()`) at insert time. `anon` has no
grants; only `authenticated` can touch the table.

## Service architecture

`tasks.service.ts` owns all Supabase access for tasks:

- `fetchTasks`, `createTask`, `updateTask`, `deleteTask`, `completeTask`, `reorderTasks`.
- Client-side validation (`validateDraft`) enforces title length (1–200) and valid
  status/priority **before** hitting the network, throwing `TaskValidationError`.
- `taskErrorMessage(error)` converts any thrown value — Postgres codes, RLS
  rejections, network failures — into a clear, user-safe string. Raw Supabase
  errors never reach the UI.
- Rows are mapped to the app model via `fromRow()` (`task.types.ts`), so the rest of
  the app never sees snake_case DB columns.

## Store architecture

`tasks.store.ts` (Pinia) holds:

- **State:** `tasks`, `loading`, `initialized`, `saving`, `error`, `lastSyncedAt`,
  `pendingChanges`, `online`.
- **Getters:** `todayTasks`, `upcomingTasks`, `completedTasks`, `highPriorityTasks`,
  `taskCounts`.
- **Actions:** `initialize`, `refresh`, `createTask`, `updateTask`, `deleteTask`,
  `toggleComplete`, `reorderTasks`, `clear`.

`initialize()` is idempotent (guarded by a module-level promise) and safe to call
from multiple components — it fetches once, subscribes to realtime once, and never
creates duplicate subscriptions.

## Realtime behavior

`subscribeRealtime(userId)` opens **one** channel filtered to
`user_id=eq.<current user>` and listens for `INSERT` / `UPDATE` / `DELETE`. Handlers
apply changes by `id`:

- INSERT/UPDATE → `upsertLocal` (replace by id, or prepend if new).
- DELETE → `removeLocal`.

Because everything is keyed by `id`, a realtime event that echoes a local optimistic
change is a no-op replacement — **no duplicate rows**. Optimistic creates use a
`temp-…` id that is swapped for the server row (real uuid) on success, so the
realtime INSERT for that same row dedupes cleanly.

The channel is torn down (`supabase.removeChannel`) in `clear()`, which runs on sign
-out and user switch (see App.vue).

## Optimistic updates

Complete, edit, delete, and reorder update the UI immediately, then persist:

1. Apply the change to `tasks` locally.
2. Call the service.
3. On success, keep it and refresh the cache + `lastSyncedAt`.
4. On failure, **roll back** to the previous state and set `error`.
5. `useTasks` shows a toast (positive on success, negative with the friendly message
   on failure).

The list is never fully re-fetched after a small change — only the affected row moves.

## Offline behavior (current scope)

Implemented now:

- **Read-only cache:** the last successful fetch is written to
  `localStorage["dashboard:tasks:<userId>"]` (namespaced per user — no cross-user
  leakage). On reload while offline, cached tasks stay visible.
- **Clear status:** `DataSyncStatus.vue` shows Offline / Saving / Sync failed / Last
  synced, and `navigator.onLine` + `online`/`offline` events drive toasts.
- **Honest writes:** while offline, mutations are **blocked** (optimistic change is
  rolled back) with a clear "you are offline" message — the app never pretends a
  change was saved remotely.
- **Auto-recovery:** on reconnect the store `refresh()`es.

**Deferred (later task):** a durable offline mutation queue (apply offline, replay on
reconnect) and conflict resolution. That is intentionally out of scope here to avoid a
premature sync engine; the read-only cache + blocked writes cover the safe baseline.

## Auth integration

`App.vue` watches `auth.user?.id`:

- **Sign in / user change:** `tasks.clear()` then `tasks.initialize()`. Clearing first
  guarantees one user's tasks never flash before another user's data loads.
- **Sign out:** `tasks.clear()` — drops in-memory tasks, resets state, and unsubscribes
  realtime.

## How to reuse this pattern (Projects, Calendar, Bank)

For each module, replicate the Tasks layering:

1. **Migration** — `create table public.<feature>` with `user_id uuid references
   auth.users on delete cascade`, an `updated_at` trigger reusing
   `public.set_updated_at()`, RLS enabled, and four `auth.uid() = user_id` policies.
   Add the table to the `supabase_realtime` publication.
2. **DB types** — add the table's Row/Insert/Update to `src/types/database.types.ts`.
3. **`types/<feature>.types.ts`** — app model + `fromRow()` mapping + validation constants.
4. **`services/<feature>.service.ts`** — typed CRUD, `validateDraft`, and a
   `<feature>ErrorMessage()` that hides raw Supabase errors.
5. **`stores/<feature>.store.ts`** — same state shape, optimistic `persist()` helper,
   single filtered realtime channel, `clear()`.
6. **`composables/use<Feature>.ts`** — map domain ⇄ page shape, centralize toasts.
7. **Auth wiring** — add an `initialize()/clear()` line to the `App.vue` watcher.
8. **`DataSyncStatus`** — reuse as-is; it is prop-driven, not tasks-specific.

Keep Supabase calls out of Vue components — always go component → composable → store →
service → Supabase.

## Reorder note

`reorderTasks` is fully implemented in the service and store (positions persisted, RLS
-safe, optimistic). The current Tasks page intentionally does **not** add a drag-and-
drop UI, to preserve the existing layout. Wire a drag handler to `useTasks().reorder(ids)`
when a reordering UX is designed.
