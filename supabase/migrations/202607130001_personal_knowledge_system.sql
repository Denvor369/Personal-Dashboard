  create extension if not exists pgcrypto with schema extensions;

  create or replace function public.set_updated_at()
  returns trigger
  language plpgsql
  set search_path = ''
  as $$
  begin
    new.updated_at = now();
    return new;
  end;
  $$;

  create table public.notes (
    id uuid primary key default extensions.gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    title text not null default '',
    content text not null default '',
    properties jsonb not null default '{}'::jsonb check (jsonb_typeof(properties) = 'object'),
    pinned boolean not null default false,
    archived boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    search_vector tsvector generated always as (
      to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, ''))
    ) stored,
    check (char_length(title) <= 500)
  );

  create table public.tags (
    id uuid primary key default extensions.gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null,
    normalized_name text generated always as (lower(btrim(name))) stored,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (char_length(btrim(name)) between 1 and 80),
    unique (user_id, normalized_name)
  );

  create table public.item_tags (
    id uuid primary key default extensions.gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    item_type text not null check (
      item_type in ('note', 'task', 'idea', 'bookmark', 'journal_entry', 'file', 'project', 'goal', 'daily_entry')
    ),
    item_id uuid not null,
    tag_id uuid not null references public.tags (id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (user_id, item_type, item_id, tag_id)
  );

  create table public.item_links (
    id uuid primary key default extensions.gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    source_type text not null check (char_length(btrim(source_type)) between 1 and 50),
    source_id uuid not null,
    target_type text not null check (char_length(btrim(target_type)) between 1 and 50),
    target_id uuid not null,
    relationship_type text not null default 'relates_to'
      check (char_length(btrim(relationship_type)) between 1 and 50),
    created_at timestamptz not null default now(),
    unique (user_id, source_type, source_id, target_type, target_id, relationship_type),
    check (source_type <> target_type or source_id <> target_id)
  );

  create table public.inbox_items (
    id uuid primary key default extensions.gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    type text not null check (type in ('note', 'task', 'idea', 'bookmark', 'journal_entry', 'file')),
    title text not null,
    description text not null default '',
    properties jsonb not null default '{}'::jsonb check (jsonb_typeof(properties) = 'object'),
    attachment_path text,
    related_type text,
    related_id uuid,
    processed boolean not null default false,
    processed_at timestamptz,
    archived boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    search_vector tsvector generated always as (
      to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
    ) stored,
    check (char_length(btrim(title)) between 1 and 500),
    check ((related_type is null) = (related_id is null)),
    check ((processed and processed_at is not null) or (not processed and processed_at is null))
  );

  create table public.note_templates (
    id uuid primary key default extensions.gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null,
    description text not null default '',
    content text not null default '',
    properties jsonb not null default '{}'::jsonb check (jsonb_typeof(properties) = 'object'),
    icon text not null default 'description',
    archived boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (char_length(btrim(name)) between 1 and 120)
  );

  create table public.smart_collections (
    id uuid primary key default extensions.gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null,
    icon text not null default 'folder',
    record_types text[] not null default '{}',
    filters jsonb not null default '{}'::jsonb check (jsonb_typeof(filters) = 'object'),
    sorting jsonb not null default '{}'::jsonb check (jsonb_typeof(sorting) = 'object'),
    preferred_layout text not null default 'list' check (preferred_layout in ('list', 'cards', 'table')),
    pinned boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (char_length(btrim(name)) between 1 and 120)
  );

  create index notes_user_updated_idx on public.notes (user_id, updated_at desc);
  create index notes_user_created_idx on public.notes (user_id, created_at desc);
  create index notes_user_archived_idx on public.notes (user_id, archived, updated_at desc);
  create index notes_user_pinned_idx on public.notes (user_id, pinned, updated_at desc) where pinned;
  create index notes_title_idx on public.notes (user_id, lower(title));
  create index notes_search_idx on public.notes using gin (search_vector);

  create index tags_user_created_idx on public.tags (user_id, created_at desc);
  create index tags_name_idx on public.tags (user_id, lower(name));

  create index item_tags_item_idx on public.item_tags (user_id, item_type, item_id);
  create index item_tags_tag_idx on public.item_tags (user_id, tag_id);

  create index item_links_source_idx on public.item_links (user_id, source_type, source_id);
  create index item_links_target_idx on public.item_links (user_id, target_type, target_id);
  create index item_links_created_idx on public.item_links (user_id, created_at desc);

  create index inbox_user_created_idx on public.inbox_items (user_id, created_at desc);
  create index inbox_user_updated_idx on public.inbox_items (user_id, updated_at desc);
  create index inbox_user_type_idx on public.inbox_items (user_id, type, created_at desc);
  create index inbox_user_processed_idx on public.inbox_items (user_id, processed, created_at desc);
  create index inbox_user_archived_idx on public.inbox_items (user_id, archived, created_at desc);
  create index inbox_title_idx on public.inbox_items (user_id, lower(title));
  create index inbox_search_idx on public.inbox_items using gin (search_vector);

  create index templates_user_updated_idx on public.note_templates (user_id, updated_at desc);
  create index templates_user_archived_idx on public.note_templates (user_id, archived, name);
  create index templates_name_idx on public.note_templates (user_id, lower(name));

  create index collections_user_updated_idx on public.smart_collections (user_id, updated_at desc);
  create index collections_user_pinned_idx on public.smart_collections (user_id, pinned, updated_at desc) where pinned;
  create index collections_record_types_idx on public.smart_collections using gin (record_types);

  create trigger notes_set_updated_at before update on public.notes
  for each row execute function public.set_updated_at();
  create trigger tags_set_updated_at before update on public.tags
  for each row execute function public.set_updated_at();
  create trigger inbox_items_set_updated_at before update on public.inbox_items
  for each row execute function public.set_updated_at();
  create trigger note_templates_set_updated_at before update on public.note_templates
  for each row execute function public.set_updated_at();
  create trigger smart_collections_set_updated_at before update on public.smart_collections
  for each row execute function public.set_updated_at();

  create or replace function public.ensure_item_tag_owner()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
  as $$
  begin
    if not exists (
      select 1 from public.tags
      where id = new.tag_id and user_id = new.user_id
    ) then
      raise exception 'Tag does not belong to the item owner';
    end if;
    return new;
  end;
  $$;

  create trigger item_tags_ensure_owner before insert or update on public.item_tags
  for each row execute function public.ensure_item_tag_owner();

  create or replace function public.delete_note_relationships()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
  as $$
  begin
    delete from public.item_tags
    where user_id = old.user_id and item_type = 'note' and item_id = old.id;

    delete from public.item_links
    where user_id = old.user_id
      and ((source_type = 'note' and source_id = old.id)
        or (target_type = 'note' and target_id = old.id));

    return old;
  end;
  $$;

  create trigger notes_delete_relationships after delete on public.notes
  for each row execute function public.delete_note_relationships();

  alter table public.notes enable row level security;
  alter table public.tags enable row level security;
  alter table public.item_tags enable row level security;
  alter table public.item_links enable row level security;
  alter table public.inbox_items enable row level security;
  alter table public.note_templates enable row level security;
  alter table public.smart_collections enable row level security;

  create policy "Users manage their notes" on public.notes
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

  create policy "Users manage their tags" on public.tags
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

  create policy "Users manage their item tags" on public.item_tags
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

  create policy "Users manage their item links" on public.item_links
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

  create policy "Users manage their inbox" on public.inbox_items
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

  create policy "Users manage their note templates" on public.note_templates
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

  create policy "Users manage their smart collections" on public.smart_collections
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

  create or replace function public.set_note_tags(note_id uuid, tag_names text[])
  returns setof public.tags
  language plpgsql
  security invoker
  set search_path = ''
  as $$
  declare
    current_user_id uuid := auth.uid();
  begin
    if not exists (
      select 1 from public.notes
      where id = note_id and user_id = current_user_id
    ) then
      raise exception 'Note not found';
    end if;

    insert into public.tags (user_id, name)
    select current_user_id, min(btrim(value))
    from unnest(coalesce(tag_names, '{}')) as names(value)
    where char_length(btrim(value)) between 1 and 80
    group by lower(btrim(value))
    on conflict (user_id, normalized_name) do nothing;

    delete from public.item_tags links
    where links.user_id = current_user_id
      and links.item_type = 'note'
      and links.item_id = note_id
      and not exists (
        select 1
        from public.tags tag, unnest(coalesce(tag_names, '{}')) as names(value)
        where tag.id = links.tag_id
          and tag.normalized_name = lower(btrim(value))
      );

    insert into public.item_tags (user_id, item_type, item_id, tag_id)
    select current_user_id, 'note', note_id, tag.id
    from public.tags tag
    where tag.user_id = current_user_id
      and tag.normalized_name in (
        select lower(btrim(value))
        from unnest(coalesce(tag_names, '{}')) as names(value)
        where char_length(btrim(value)) between 1 and 80
      )
    on conflict (user_id, item_type, item_id, tag_id) do nothing;

    return query
    select tag.*
    from public.tags tag
    join public.item_tags links on links.tag_id = tag.id
    where links.user_id = current_user_id
      and links.item_type = 'note'
      and links.item_id = note_id
    order by tag.name;
  end;
  $$;

  create or replace function public.search_knowledge(
    search_query text,
    result_limit integer default 30,
    result_offset integer default 0
  )
  returns table (
    id uuid,
    record_type text,
    title text,
    preview text,
    updated_at timestamptz,
    rank real
  )
  language sql
  stable
  security invoker
  set search_path = ''
  as $$
    with query as (
      select websearch_to_tsquery('simple', btrim(search_query)) as value
    ), results as (
      select
        notes.id,
        'note'::text as record_type,
        notes.title,
        left(notes.content, 220) as preview,
        notes.updated_at,
        ts_rank(notes.search_vector, query.value) as rank
      from public.notes, query
      where notes.user_id = auth.uid()
        and not notes.archived
        and notes.search_vector @@ query.value
      union all
      select
        inbox_items.id,
        inbox_items.type as record_type,
        inbox_items.title,
        left(inbox_items.description, 220) as preview,
        inbox_items.updated_at,
        ts_rank(inbox_items.search_vector, query.value) as rank
      from public.inbox_items, query
      where inbox_items.user_id = auth.uid()
        and not inbox_items.archived
        and inbox_items.search_vector @@ query.value
    )
    select * from results
    where nullif(btrim(search_query), '') is not null
    order by rank desc, updated_at desc
    limit least(greatest(result_limit, 1), 100)
    offset greatest(result_offset, 0);
  $$;

  create or replace function public.ensure_default_note_templates()
  returns setof public.note_templates
  language plpgsql
  security invoker
  set search_path = ''
  as $$
  declare
    current_user_id uuid := auth.uid();
  begin
    if current_user_id is null then
      raise exception 'Authentication required';
    end if;

    insert into public.note_templates (user_id, name, description, content, icon)
    select current_user_id, defaults.name, defaults.description, defaults.content, defaults.icon
    from (values
      ('Project note', 'Keep decisions and next steps together.', '# {{title}}\n\n## Context\n\n## Decisions\n\n## Next steps\n', 'folder'),
      ('Learning note', 'Capture what you learned and where it came from.', '# {{title}}\n\n## Summary\n\n## Key ideas\n\n## Sources\n', 'school'),
      ('Daily journal', 'A simple daily reflection.', '# {{date}}\n\n## Today\n\n## Reflection\n\n## Tomorrow\n', 'auto_stories'),
      ('Job application', 'Track an application and follow-up.', '# {{title}}\n\n## Company\n\n## Role\n\n## Contacts\n\n## Next action\n', 'work'),
      ('Meeting note', 'Record attendees, discussion, and actions.', '# {{title}}\n\n**Date:** {{date}} {{time}}\n\n## Attendees\n\n## Notes\n\n## Actions\n', 'groups'),
      ('Weekly review', 'Review wins, loose ends, and priorities.', '# Week of {{date}}\n\n## Wins\n\n## Open loops\n\n## Next week\n', 'event_repeat'),
      ('Blank note', 'Start with an empty note.', '', 'description')
    ) as defaults(name, description, content, icon)
    where not exists (
      select 1 from public.note_templates existing
      where existing.user_id = current_user_id
        and lower(existing.name) = lower(defaults.name)
    );

    return query
    select * from public.note_templates
    where user_id = current_user_id and not archived
    order by name;
  end;
  $$;

  grant execute on function public.search_knowledge(text, integer, integer) to authenticated;
  grant execute on function public.ensure_default_note_templates() to authenticated;
  grant execute on function public.set_note_tags(uuid, text[]) to authenticated;

  revoke all on function public.ensure_item_tag_owner() from public;
  revoke all on function public.delete_note_relationships() from public;
  revoke all on function public.set_updated_at() from public;
