import { ref, shallowRef } from 'vue';
import { defineStore } from 'pinia';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/boot/supabase';
import type { Json, TableRow, TableUpdate } from '@/types/database.types';

export type NoteSort = 'updated_at' | 'created_at' | 'title';
export type NoteWithTags = TableRow<'notes'> & { tags: TableRow<'tags'>[] };

export interface NoteFilters {
  archived: boolean;
  pinned: boolean;
  search: string;
  sort: NoteSort;
}

export interface NoteDraft {
  content: string;
  pinned: boolean;
  properties: Json;
  tags: string[];
  title: string;
}

const pageSize = 30;

let channel: RealtimeChannel | undefined;
let refetchTimer: ReturnType<typeof setTimeout> | undefined;
let lastFilters: NoteFilters | undefined;

export const useNotesStore = defineStore('notes', () => {
  const notes = shallowRef<NoteWithTags[]>([]);
  const loading = ref(false);
  const saving = ref(false);
  const error = ref('');
  const page = ref(0);
  const hasMore = ref(false);

  async function userId() {
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError || !data.user) throw new Error('Sign in to view and save your notes.');
    return data.user.id;
  }

  async function attachTags(rows: TableRow<'notes'>[]): Promise<NoteWithTags[]> {
    if (!rows.length) return [];

    const ids = rows.map((note) => note.id);
    const { data: links, error: linksError } = await supabase
      .from('item_tags')
      .select('item_id, tag_id')
      .eq('item_type', 'note')
      .in('item_id', ids);
    if (linksError) throw linksError;
    if (!links.length) return rows.map((note) => ({ ...note, tags: [] }));

    const tagIds = [...new Set(links.map((link) => link.tag_id))];
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .in('id', tagIds);
    if (tagsError) throw tagsError;

    const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
    const tagsByNote = new Map<string, TableRow<'tags'>[]>();
    for (const link of links) {
      const tag = tagsById.get(link.tag_id);
      if (tag) tagsByNote.set(link.item_id, [...(tagsByNote.get(link.item_id) ?? []), tag]);
    }

    return rows.map((note) => ({ ...note, tags: tagsByNote.get(note.id) ?? [] }));
  }

  /** A row changed remotely in a way local merging can't place: reload page 0 with the current filters. */
  function scheduleRefetch() {
    clearTimeout(refetchTimer);
    refetchTimer = setTimeout(() => {
      if (lastFilters) void fetchNotes(lastFilters, 0);
    }, 300);
  }

  function subscribeRealtime(uid: string) {
    if (channel) return;
    channel = supabase
      .channel(`notes:${uid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notes', filter: `user_id=eq.${uid}` },
        (payload) => {
          // Our own optimistic inserts are already in the list; only remote ones need a refetch
          // (sorting/filter/search membership can't be evaluated locally).
          const row = payload.new as TableRow<'notes'>;
          if (!notes.value.some((note) => note.id === row.id)) scheduleRefetch();
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notes', filter: `user_id=eq.${uid}` },
        (payload) => {
          // ponytail: tags edited on another device stay stale until the next fetch.
          const row = payload.new as TableRow<'notes'>;
          if (notes.value.some((note) => note.id === row.id)) {
            notes.value = notes.value.map((note) =>
              note.id === row.id ? { ...row, tags: note.tags } : note,
            );
          } else {
            scheduleRefetch();
          }
        },
      )
      .on(
        // Unfiltered: DELETE payloads only carry the primary key, so a user_id
        // filter would silently drop them. Removing a foreign id is a no-op.
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notes' },
        (payload) => {
          const id = (payload.old as { id: string }).id;
          notes.value = notes.value.filter((note) => note.id !== id);
        },
      )
      .subscribe();
  }

  async function fetchNotes(filters: NoteFilters, nextPage = 0) {
    loading.value = true;
    error.value = '';
    try {
      subscribeRealtime(await userId());
      lastFilters = { ...filters };
      const from = nextPage * pageSize;
      let query = supabase
        .from('notes')
        .select('*', { count: 'exact' })
        .eq('archived', filters.archived)
        .order('pinned', { ascending: false })
        .order(filters.sort, { ascending: filters.sort === 'title' })
        .range(from, from + pageSize - 1);

      if (filters.pinned) query = query.eq('pinned', true);
      if (filters.search.trim()) {
        query = query.textSearch('search_vector', filters.search.trim(), {
          config: 'simple',
          type: 'websearch',
        });
      }

      const { data, count, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      const tagged = await attachTags(data);
      notes.value = nextPage ? [...notes.value, ...tagged] : tagged;
      page.value = nextPage;
      hasMore.value = from + data.length < (count ?? 0);
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Could not load notes.';
      if (!nextPage) notes.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function syncTags(noteId: string, names: string[]) {
    const uniqueNames = [
      ...new Map(names.map((name) => [name.trim().toLocaleLowerCase(), name.trim()])).values(),
    ].filter(Boolean);

    const { data: tags, error: tagsError } = await supabase.rpc('set_note_tags', {
      note_id: noteId,
      tag_names: uniqueNames,
    });
    if (tagsError) throw tagsError;
    return tags;
  }

  async function createNote(draft: NoteDraft) {
    saving.value = true;
    error.value = '';
    const id = crypto.randomUUID();
    let persisted: NoteWithTags | undefined;
    try {
      const ownerId = await userId();
      const now = new Date().toISOString();
      const optimistic: NoteWithTags = {
        archived: false,
        content: draft.content,
        created_at: now,
        id,
        pinned: draft.pinned,
        properties: draft.properties,
        search_vector: null,
        tags: draft.tags.map((name) => ({
          created_at: now,
          id: name,
          name,
          normalized_name: name.toLocaleLowerCase(),
          updated_at: now,
          user_id: ownerId,
        })),
        title: draft.title.trim(),
        updated_at: now,
        user_id: ownerId,
      };
      notes.value = [optimistic, ...notes.value];

      const { data, error: insertError } = await supabase
        .from('notes')
        .insert({
          content: draft.content,
          id,
          pinned: draft.pinned,
          properties: draft.properties,
          title: draft.title.trim(),
          user_id: ownerId,
        })
        .select()
        .single();
      if (insertError) throw insertError;
      persisted = { ...data, tags: [] };
      notes.value = notes.value.map((note) => (note.id === id ? persisted! : note));
      const tags = await syncTags(id, draft.tags);
      notes.value = notes.value.map((note) => (note.id === id ? { ...data, tags } : note));
      return id;
    } catch (caught) {
      notes.value = persisted
        ? notes.value.map((note) => (note.id === id ? persisted! : note))
        : notes.value.filter((note) => note.id !== id);
      error.value = caught instanceof Error ? caught.message : 'Could not create the note.';
      throw caught;
    } finally {
      saving.value = false;
    }
  }

  async function updateNote(id: string, changes: TableUpdate<'notes'>, tagNames?: string[]) {
    saving.value = true;
    error.value = '';
    const previous = notes.value.find((note) => note.id === id);
    let persisted: NoteWithTags | undefined;
    if (previous) {
      notes.value = notes.value.map((note) =>
        note.id === id ? { ...note, ...changes, updated_at: new Date().toISOString() } : note,
      );
    }

    try {
      await userId();
      const { data, error: updateError } = await supabase
        .from('notes')
        .update(changes)
        .eq('id', id)
        .select()
        .single();
      if (updateError) throw updateError;
      persisted = { ...data, tags: previous?.tags ?? [] };
      notes.value = notes.value.map((note) => (note.id === id ? persisted! : note));
      const tags = tagNames ? await syncTags(id, tagNames) : (previous?.tags ?? []);
      notes.value = notes.value.map((note) => (note.id === id ? { ...data, tags } : note));
    } catch (caught) {
      const fallback = persisted ?? previous;
      if (fallback) notes.value = notes.value.map((note) => (note.id === id ? fallback : note));
      error.value = caught instanceof Error ? caught.message : 'Could not save the note.';
      throw caught;
    } finally {
      saving.value = false;
    }
  }

  async function deleteNote(id: string) {
    const previous = notes.value;
    notes.value = notes.value.filter((note) => note.id !== id);
    const { error: deleteError } = await supabase.from('notes').delete().eq('id', id);
    if (deleteError) {
      notes.value = previous;
      error.value = deleteError.message;
      throw deleteError;
    }
  }

  function clear() {
    if (channel) {
      void supabase.removeChannel(channel);
      channel = undefined;
    }
    clearTimeout(refetchTimer);
    lastFilters = undefined;
    notes.value = [];
    page.value = 0;
    hasMore.value = false;
    loading.value = false;
    saving.value = false;
    error.value = '';
  }

  return {
    clear,
    createNote,
    deleteNote,
    error,
    fetchNotes,
    hasMore,
    loading,
    notes,
    page,
    saving,
    updateNote,
  };
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (channel) void supabase.removeChannel(channel);
    channel = undefined;
    lastFilters = undefined;
  });
}
