-- Connected accounts for integrations (GitHub first).
-- Stores per-user provider tokens. Access is limited to the row owner via RLS;
-- tokens are personal fine-grained read-only tokens the user creates themselves.

create table if not exists public.connected_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  account_label text not null default '',
  access_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.connected_accounts enable row level security;

drop policy if exists "Users read their own connected accounts" on public.connected_accounts;
create policy "Users read their own connected accounts" on public.connected_accounts
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users insert their own connected accounts" on public.connected_accounts;
create policy "Users insert their own connected accounts" on public.connected_accounts
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users update their own connected accounts" on public.connected_accounts;
create policy "Users update their own connected accounts" on public.connected_accounts
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete their own connected accounts" on public.connected_accounts;
create policy "Users delete their own connected accounts" on public.connected_accounts
for delete to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.connected_accounts from anon;
grant select, insert, update, delete on public.connected_accounts to authenticated;
