-- Skills (Learn page): per-user skill list with RLS, updated_at trigger, and realtime.
-- Also adds notes to the realtime publication (missed in 202607130001).
-- Reuses public.set_updated_at() defined in 202607130001_personal_knowledge_system.sql.
-- id is text (not uuid): pre-existing local data uses slugs like 'guitar'.

create table if not exists public.skills (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null default 'Other',
  goal text not null default '',
  progress integer not null default 0,
  practice_minutes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skills_id_length check (char_length(id) between 1 and 64),
  constraint skills_name_length check (char_length(btrim(name)) between 1 and 120),
  constraint skills_goal_length check (char_length(goal) <= 500),
  constraint skills_category_value check (
    category in ('Music', 'DevOps', 'Programming', 'Language', 'Fitness', 'Design', 'Other')
  ),
  constraint skills_progress_range check (progress between 0 and 100),
  constraint skills_practice_nonnegative check (practice_minutes >= 0)
);

create index if not exists skills_user_created_idx on public.skills (user_id, created_at desc);

drop trigger if exists skills_set_updated_at on public.skills;
create trigger skills_set_updated_at before update on public.skills
for each row execute function public.set_updated_at();

alter table public.skills enable row level security;

drop policy if exists "Users read their own skills" on public.skills;
create policy "Users read their own skills" on public.skills
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users insert their own skills" on public.skills;
create policy "Users insert their own skills" on public.skills
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users update their own skills" on public.skills;
create policy "Users update their own skills" on public.skills
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete their own skills" on public.skills;
create policy "Users delete their own skills" on public.skills
for delete to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.skills from anon;
grant select, insert, update, delete on public.skills to authenticated;

-- Realtime: publish skills and notes so postgres_changes subscriptions work.
-- Guarded like the tasks migration, in case the publication is absent or a
-- table is already a member.
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['skills', 'notes'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end
$$;
