import { ref, shallowRef } from 'vue';
import { defineStore } from 'pinia';
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

  async function fetchNotes(filters: NoteFilters, nextPage = 0) {
    loading.value = true;
    error.value = '';
    try {
      await userId();
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

  return {
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
