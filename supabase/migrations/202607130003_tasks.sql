-- Tasks: per-user task list with RLS, updated_at trigger, and realtime.
-- Reuses public.set_updated_at() defined in 202607130001_personal_knowledge_system.sql.
-- `project` is not in the original spec but the Tasks UI edits/displays it, so it is
-- persisted here as a nullable free-text label (see docs/TASKS_PERSISTENCE.md).

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  project text,
  status text not null default 'today',
  priority text not null default 'medium',
  due_at timestamptz,
  completed_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_title_length check (char_length(btrim(title)) between 1 and 200),
  constraint tasks_description_length check (description is null or char_length(description) <= 2000),
  constraint tasks_project_length check (project is null or char_length(project) <= 120),
  constraint tasks_status_value check (status in ('today', 'upcoming', 'completed')),
  constraint tasks_priority_value check (priority in ('high', 'medium', 'low')),
  -- completed_at may only be set when the task is completed.
  constraint tasks_completed_consistency check (completed_at is null or status = 'completed')
);

create index if not exists tasks_user_position_idx on public.tasks (user_id, position);
create index if not exists tasks_user_status_idx on public.tasks (user_id, status);
create index if not exists tasks_user_due_idx on public.tasks (user_id, due_at);

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks
for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;

drop policy if exists "Users read their own tasks" on public.tasks;
create policy "Users read their own tasks" on public.tasks
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users insert their own tasks" on public.tasks;
create policy "Users insert their own tasks" on public.tasks
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users update their own tasks" on public.tasks;
create policy "Users update their own tasks" on public.tasks
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete their own tasks" on public.tasks;
create policy "Users delete their own tasks" on public.tasks
for delete to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.tasks from anon;
grant select, insert, update, delete on public.tasks to authenticated;

-- Realtime: publish tasks so filtered subscriptions work. Guard in case the
-- publication is absent (rare) or the table is already a member.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks'
     )
  then
    alter publication supabase_realtime add table public.tasks;
  end if;
end
$$;
