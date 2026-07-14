<template>
  <!-- ===================== START SCREEN (Word backstage) ===================== -->
  <main v-if="view === 'home'" class="word-home" aria-label="Notes home">
    <header class="word-home__header">
      <div>
        <p class="dashboard-eyebrow">Notes</p>
        <h1>{{ greeting }}, Denvor</h1>
      </div>
      <q-input
        v-model="search"
        dense
        outlined
        clearable
        placeholder="Search documents"
        class="word-home__search"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>
    </header>

    <!-- Template gallery -->
    <section class="word-home__section" aria-label="Create new">
      <h2 class="word-home__label">New</h2>
      <div class="template-row">
        <button
          v-for="tpl in templates"
          :key="tpl.name"
          type="button"
          class="template-card"
          @click="newDoc(tpl)"
        >
          <span class="template-card__sheet" :class="`template-card__sheet--${tpl.tone}`">
            <q-icon :name="tpl.icon" />
          </span>
          <span class="template-card__name">{{ tpl.name }}</span>
        </button>
      </div>
    </section>

    <!-- Folders -->
    <section class="word-home__section" aria-label="Folders">
      <h2 class="word-home__label">Folders</h2>
      <div class="folder-row">
        <button
          type="button"
          class="folder-card"
          :class="{ 'folder-card--active': activeFolder === 'all' }"
          @click="activeFolder = 'all'"
        >
          <q-icon name="folder_copy" />
          <span class="folder-card__name">All documents</span>
          <small>{{ docs.length }} files</small>
        </button>

        <div
          v-for="folder in folders"
          :key="folder.id"
          class="folder-card"
          :class="{ 'folder-card--active': activeFolder === folder.id }"
          role="button"
          tabindex="0"
          @click="activeFolder = folder.id"
          @keydown.enter="activeFolder = folder.id"
        >
          <q-icon name="folder" />
          <input
            v-if="renamingId === folder.id"
            v-model="renameText"
            class="folder-card__rename"
            aria-label="Folder name"
            @click.stop
            @keydown.enter="commitRename"
            @blur="commitRename"
          />
          <span v-else class="folder-card__name">{{ folder.name }}</span>
          <small>{{ folderCount(folder.id) }} files</small>
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="more_vert"
            class="folder-card__menu"
            :aria-label="`Options for ${folder.name}`"
            @click.stop
          >
            <q-menu anchor="bottom right" self="top right">
              <q-list dense class="word-menu">
                <q-item v-close-popup clickable @click="startRename(folder)">
                  <q-item-section avatar><q-icon name="edit" /></q-item-section>
                  <q-item-section>Rename</q-item-section>
                </q-item>
                <q-item v-close-popup clickable @click="deleteFolder(folder.id)">
                  <q-item-section avatar><q-icon name="delete_outline" /></q-item-section>
                  <q-item-section>Delete folder</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>

        <button
          v-if="!addingFolder"
          type="button"
          class="folder-card folder-card--new"
          @click="addingFolder = true"
        >
          <q-icon name="create_new_folder" />
          <span class="folder-card__name">New folder</span>
        </button>
        <div v-else class="folder-card folder-card--new">
          <q-icon name="create_new_folder" />
          <input
            ref="newFolderInput"
            v-model="newFolderName"
            class="folder-card__rename"
            placeholder="Folder name"
            aria-label="New folder name"
            @keydown.enter="commitNewFolder"
            @blur="commitNewFolder"
          />
        </div>
      </div>
    </section>

    <!-- Recent documents -->
    <section class="word-home__section word-home__section--grow" aria-label="Documents">
      <div class="word-home__listhead">
        <h2 class="word-home__label">
          {{ activeFolder === 'all' ? 'Recent' : folderName(activeFolder) }}
        </h2>
        <span class="workspace-meta">{{ visibleDocs.length }} documents</span>
      </div>

      <div v-if="visibleDocs.length" class="doc-list">
        <div
          v-for="doc in visibleDocs"
          :key="doc.id"
          class="doc-row"
          role="button"
          tabindex="0"
          @click="openDoc(doc.id)"
          @keydown.enter="openDoc(doc.id)"
        >
          <q-icon name="description" class="doc-row__icon" />
          <span class="doc-row__name">
            <strong>{{ doc.title || 'Untitled document' }}</strong>
            <small>{{ snippet(doc) }}</small>
          </span>
          <q-icon v-if="doc.pinned" name="push_pin" class="doc-row__pin" aria-label="Pinned" />
          <span v-if="doc.folderId" class="doc-row__folder">
            <q-icon name="folder" /> {{ folderName(doc.folderId) }}
          </span>
          <span class="doc-row__when">{{ formatWhen(doc.updatedTs) }}</span>
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="more_vert"
            :aria-label="`Options for ${doc.title}`"
            @click.stop
          >
            <q-menu anchor="bottom right" self="top right">
              <q-list dense class="word-menu">
                <q-item v-close-popup clickable @click="togglePin(doc)">
                  <q-item-section avatar><q-icon name="push_pin" /></q-item-section>
                  <q-item-section>{{ doc.pinned ? 'Unpin' : 'Pin' }}</q-item-section>
                </q-item>
                <q-item v-close-popup clickable @click="duplicateDoc(doc)">
                  <q-item-section avatar><q-icon name="content_copy" /></q-item-section>
                  <q-item-section>Duplicate</q-item-section>
                </q-item>
                <q-item v-close-popup clickable @click="removeDoc(doc.id)">
                  <q-item-section avatar><q-icon name="delete_outline" /></q-item-section>
                  <q-item-section>Delete</q-item-section>
                </q-item>
                <q-separator />
                <q-item-label header>Move to</q-item-label>
                <q-item v-close-popup clickable @click="moveDoc(doc, null)">
                  <q-item-section avatar><q-icon name="folder_off" /></q-item-section>
                  <q-item-section>No folder</q-item-section>
                </q-item>
                <q-item
                  v-for="folder in folders"
                  :key="folder.id"
                  v-close-popup
                  clickable
                  @click="moveDoc(doc, folder.id)"
                >
                  <q-item-section avatar><q-icon name="folder" /></q-item-section>
                  <q-item-section>{{ folder.name }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>
      <div v-else class="word-home__empty">
        <q-icon name="topic" />
        <p>Nothing here yet. Create a document or pick another folder.</p>
      </div>
    </section>
  </main>

  <!-- ===================== EDITOR (Word document view) ===================== -->
  <main v-else class="word-app" aria-label="Notes document editor">
    <header class="word-titlebar">
      <div class="word-titlebar__left">
        <q-btn
          flat
          round
          dense
          icon="arrow_back"
          aria-label="Back to documents"
          @click="view = 'home'"
        >
          <q-tooltip>Back to documents</q-tooltip>
        </q-btn>
        <span class="word-titlebar__autosave"><q-icon name="cloud_done" /> AutoSave on</span>
      </div>
      <input
        v-if="active"
        v-model="active.title"
        class="word-titlebar__title"
        aria-label="Document title"
        @input="touch"
      />
      <div class="word-titlebar__right">
        <span class="word-titlebar__saved">{{ savedLabel }}</span>
        <q-btn flat round dense icon="print" aria-label="Print document" @click="printDoc">
          <q-tooltip>Print</q-tooltip>
        </q-btn>
      </div>
    </header>

    <nav class="word-tabs" aria-label="Ribbon">
      <button type="button" class="word-tab word-tab--file">
        File
        <q-menu anchor="bottom left" self="top left">
          <q-list class="word-menu">
            <q-item v-close-popup clickable @click="newDoc(templates[0]!)">
              <q-item-section avatar><q-icon name="note_add" /></q-item-section>
              <q-item-section>New document</q-item-section>
            </q-item>
            <q-item v-close-popup clickable @click="active && duplicateDoc(active)">
              <q-item-section avatar><q-icon name="content_copy" /></q-item-section>
              <q-item-section>Duplicate</q-item-section>
            </q-item>
            <q-item v-close-popup clickable @click="printDoc">
              <q-item-section avatar><q-icon name="print" /></q-item-section>
              <q-item-section>Print</q-item-section>
            </q-item>
            <q-separator />
            <q-item-label header>Move to</q-item-label>
            <q-item v-close-popup clickable @click="active && moveDoc(active, null)">
              <q-item-section avatar><q-icon name="folder_off" /></q-item-section>
              <q-item-section>No folder</q-item-section>
            </q-item>
            <q-item
              v-for="folder in folders"
              :key="folder.id"
              v-close-popup
              clickable
              @click="active && moveDoc(active, folder.id)"
            >
              <q-item-section avatar><q-icon name="folder" /></q-item-section>
              <q-item-section>{{ folder.name }}</q-item-section>
            </q-item>
            <q-separator />
            <q-item
              v-close-popup
              clickable
              :disable="!active"
              @click="active && removeDoc(active.id, true)"
            >
              <q-item-section avatar><q-icon name="delete_outline" /></q-item-section>
              <q-item-section>Delete document</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </button>
      <button type="button" class="word-tab word-tab--active" aria-current="true">Home</button>
    </nav>

    <div class="word-body">
      <aside class="word-sidebar" aria-label="Documents">
        <q-input
          v-model="search"
          dense
          outlined
          clearable
          placeholder="Search documents"
          class="word-sidebar__search"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
        <button type="button" class="word-sidebar__new" @click="newDoc(templates[0]!)">
          <q-icon name="add" /> New blank document
        </button>
        <div class="word-sidebar__list">
          <button
            v-for="doc in visibleDocs"
            :key="doc.id"
            type="button"
            class="word-doc"
            :class="{ 'word-doc--active': doc.id === activeId }"
            @click="activeId = doc.id"
          >
            <q-icon name="description" class="word-doc__icon" />
            <span class="word-doc__text">
              <strong>{{ doc.title || 'Untitled document' }}</strong>
              <small>
                <template v-if="doc.folderId">{{ folderName(doc.folderId) }} · </template>
                {{ formatWhen(doc.updatedTs) }}
              </small>
            </span>
            <q-icon v-if="doc.pinned" name="push_pin" class="word-doc__pin" />
          </button>
        </div>
      </aside>

      <section class="word-canvas" aria-label="Document page">
        <q-editor
          v-if="active"
          v-model="active.content"
          class="word-editor"
          content-class="word-sheet"
          :toolbar="toolbar"
          :fonts="fonts"
          placeholder="Start writing…"
          @update:model-value="touch"
        />
        <div v-else class="word-canvas__empty">
          <q-icon name="description" />
          <p>No document selected. Create one to start writing.</p>
        </div>
      </section>
    </div>

    <footer class="word-statusbar">
      <span>Page 1</span>
      <span>{{ wordCount }} words</span>
      <span>{{ charCount }} characters</span>
      <span class="word-statusbar__right">{{ savedLabel }}</span>
    </footer>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { workspaceNotes } from '@/data/workspace.mock';

interface WordDoc {
  id: string;
  title: string;
  content: string;
  updatedTs: number;
  folderId: string | null;
  pinned: boolean;
}
interface WordFolder {
  id: string;
  name: string;
}
interface Template {
  name: string;
  icon: string;
  tone: 'blank' | 'mint' | 'teal' | 'dark';
  title: string;
  content: string;
}

const storageKey = 'personal-dashboard-word-notes';
const $q = useQuasar();

// ---- templates ----
const templates: Template[] = [
  {
    name: 'Blank document',
    icon: 'add',
    tone: 'blank',
    title: 'Untitled document',
    content: '<p></p>',
  },
  {
    name: 'Meeting notes',
    icon: 'groups',
    tone: 'teal',
    title: 'Meeting notes',
    content:
      '<h1>Meeting notes</h1><p><i>Date, attendees, and purpose.</i></p><h2>Agenda</h2><ul><li>&nbsp;</li></ul><h2>Decisions</h2><ul><li>&nbsp;</li></ul><h2>Action items</h2><ol><li>&nbsp;</li></ol>',
  },
  {
    name: 'Weekly plan',
    icon: 'event_note',
    tone: 'mint',
    title: 'Weekly plan',
    content:
      '<h1>Weekly plan</h1><h2>Focus</h2><p>&nbsp;</p><h2>Tasks</h2><ul><li>&nbsp;</li></ul><h2>Notes</h2><p>&nbsp;</p>',
  },
  {
    name: 'Journal entry',
    icon: 'auto_stories',
    tone: 'dark',
    title: 'Journal entry',
    content:
      '<h1>Journal</h1><p><i>What happened today?</i></p><p>&nbsp;</p><h2>Grateful for</h2><ul><li>&nbsp;</li></ul>',
  },
];

// ---- persistence + migration ----
interface PersistV2 {
  v: 2;
  docs: WordDoc[];
  folders: WordFolder[];
}

function seedState(): PersistV2 {
  const folders: WordFolder[] = [
    { id: 'f-work', name: 'Work' },
    { id: 'f-ideas', name: 'Ideas' },
    { id: 'f-personal', name: 'Personal' },
  ];
  const tagToFolder: Record<string, string> = {
    Work: 'f-work',
    Planning: 'f-work',
    Product: 'f-work',
    Design: 'f-work',
    Ideas: 'f-ideas',
    Research: 'f-ideas',
    Personal: 'f-personal',
  };
  const now = Date.now();
  const docs: WordDoc[] = workspaceNotes.map((note, index) => ({
    id: String(note.id),
    title: note.title,
    content: `<p>${note.preview}</p>`,
    updatedTs: now - index * 5 * 3600_000,
    folderId: tagToFolder[note.tag] ?? null,
    pinned: note.pinned,
  }));
  return { v: 2, docs, folders };
}

function load(): PersistV2 {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      // v1 was a bare array of docs without folders/pins/timestamps.
      if (Array.isArray(parsed)) {
        const now = Date.now();
        const docs = (parsed as Array<Record<string, unknown>>).map((doc, index) => ({
          id: typeof doc.id === 'string' ? doc.id : crypto.randomUUID(),
          title: typeof doc.title === 'string' ? doc.title : 'Untitled document',
          content: typeof doc.content === 'string' ? doc.content : '<p></p>',
          updatedTs: now - index * 3600_000,
          folderId: null,
          pinned: false,
        }));
        return { v: 2, docs, folders: seedState().folders };
      }
      const state = parsed as PersistV2;
      if (state && Array.isArray(state.docs) && Array.isArray(state.folders)) return state;
    }
  } catch {
    // Corrupt storage — fall back to seeds.
  }
  return seedState();
}

const initial = load();
const docs = ref<WordDoc[]>(initial.docs);
const folders = ref<WordFolder[]>(initial.folders);

let saveTimer: ReturnType<typeof setTimeout> | undefined;
const savedAt = ref('');
function persist() {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ v: 2, docs: docs.value, folders: folders.value }),
    );
    savedAt.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    // Storage unavailable — editing still works in memory.
  }
}
function touch() {
  if (active.value) active.value.updatedTs = Date.now();
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 600);
}
onBeforeUnmount(() => {
  if (saveTimer) clearTimeout(saveTimer);
  persist();
});

// ---- views ----
const view = ref<'home' | 'editor'>('home');
const activeId = ref<string | null>(null);
const search = ref('');
const activeFolder = ref<string>('all');

const active = computed(() => docs.value.find((doc) => doc.id === activeId.value) ?? null);

const hours = new Date().getHours();
const greeting = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening';

function stripHtml(html: string): string {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el.textContent ?? '';
}
function snippet(doc: WordDoc): string {
  return stripHtml(doc.content).trim().slice(0, 90);
}
function formatWhen(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const visibleDocs = computed(() => {
  const query = search.value?.trim().toLocaleLowerCase() ?? '';
  return docs.value
    .filter((doc) => activeFolder.value === 'all' || doc.folderId === activeFolder.value)
    .filter(
      (doc) =>
        !query ||
        doc.title.toLocaleLowerCase().includes(query) ||
        stripHtml(doc.content).toLocaleLowerCase().includes(query),
    )
    .slice()
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedTs - a.updatedTs);
});

const plainText = computed(() => (active.value ? stripHtml(active.value.content) : ''));
const wordCount = computed(() => plainText.value.trim().split(/\s+/).filter(Boolean).length);
const charCount = computed(() => plainText.value.length);
const savedLabel = computed(() => (savedAt.value ? `Saved ${savedAt.value}` : 'All changes saved'));

// ---- document actions ----
function openDoc(id: string) {
  activeId.value = id;
  view.value = 'editor';
}
function newDoc(tpl: Template) {
  const doc: WordDoc = {
    id: crypto.randomUUID(),
    title: tpl.title,
    content: tpl.content,
    updatedTs: Date.now(),
    folderId: activeFolder.value === 'all' ? null : activeFolder.value,
    pinned: false,
  };
  docs.value = [doc, ...docs.value];
  persist();
  openDoc(doc.id);
}
function duplicateDoc(doc: WordDoc) {
  const copy: WordDoc = {
    ...doc,
    id: crypto.randomUUID(),
    title: `${doc.title} (copy)`,
    updatedTs: Date.now(),
    pinned: false,
  };
  docs.value = [copy, ...docs.value];
  persist();
  $q.notify({ message: 'Document duplicated', timeout: 1200 });
}
function removeDoc(id: string, fromEditor = false) {
  const doc = docs.value.find((item) => item.id === id);
  if (!doc) return;
  if (!window.confirm(`Delete "${doc.title || 'Untitled document'}"?`)) return;
  docs.value = docs.value.filter((item) => item.id !== id);
  if (activeId.value === id) {
    activeId.value = docs.value[0]?.id ?? null;
    if (fromEditor && !activeId.value) view.value = 'home';
  }
  persist();
  $q.notify({ message: 'Document deleted', timeout: 1400 });
}
function togglePin(doc: WordDoc) {
  doc.pinned = !doc.pinned;
  persist();
}
function moveDoc(doc: WordDoc, folderId: string | null) {
  doc.folderId = folderId;
  persist();
}
function printDoc() {
  window.print();
}

// ---- folder actions ----
const addingFolder = ref(false);
const newFolderName = ref('');
const newFolderInput = ref<HTMLInputElement | null>(null);
const renamingId = ref<string | null>(null);
const renameText = ref('');

watch(addingFolder, async (open) => {
  if (open) {
    await nextTick();
    newFolderInput.value?.focus();
  }
});

function folderName(id: string): string {
  return folders.value.find((folder) => folder.id === id)?.name ?? 'Folder';
}
function folderCount(id: string): number {
  return docs.value.filter((doc) => doc.folderId === id).length;
}
function commitNewFolder() {
  const name = newFolderName.value.trim();
  if (name) {
    folders.value = [...folders.value, { id: crypto.randomUUID(), name }];
    persist();
  }
  addingFolder.value = false;
  newFolderName.value = '';
}
function startRename(folder: WordFolder) {
  renamingId.value = folder.id;
  renameText.value = folder.name;
}
function commitRename() {
  const folder = folders.value.find((item) => item.id === renamingId.value);
  const name = renameText.value.trim();
  if (folder && name) {
    folder.name = name;
    persist();
  }
  renamingId.value = null;
}
function deleteFolder(id: string) {
  if (!window.confirm(`Delete "${folderName(id)}"? Documents inside are kept.`)) return;
  docs.value.forEach((doc) => {
    if (doc.folderId === id) doc.folderId = null;
  });
  folders.value = folders.value.filter((folder) => folder.id !== id);
  if (activeFolder.value === id) activeFolder.value = 'all';
  persist();
}

// ---- ribbon config (QEditor built-in commands) ----
const toolbar = [
  ['undo', 'redo'],
  [
    {
      label: 'Styles',
      icon: 'text_format',
      list: 'no-icons',
      options: ['p', 'h1', 'h2', 'h3', 'quote', 'code'],
    },
    {
      label: 'Font',
      icon: 'font_download',
      fixedIcon: true,
      list: 'no-icons',
      options: ['default_font', 'arial', 'courier_new', 'georgia', 'times_new_roman', 'verdana'],
    },
    {
      label: 'Size',
      icon: 'format_size',
      fixedIcon: true,
      list: 'no-icons',
      options: ['size-1', 'size-2', 'size-3', 'size-4', 'size-5', 'size-6', 'size-7'],
    },
  ],
  ['bold', 'italic', 'underline', 'strike'],
  [
    {
      label: 'Align',
      icon: 'format_align_left',
      fixedIcon: true,
      list: 'only-icons',
      options: ['left', 'center', 'right', 'justify'],
    },
  ],
  ['unordered', 'ordered', 'outdent', 'indent'],
  ['link', 'hr', 'removeFormat'],
  ['fullscreen'],
];

const fonts = {
  arial: 'Arial',
  courier_new: 'Courier New',
  georgia: 'Georgia',
  times_new_roman: 'Times New Roman',
  verdana: 'Verdana',
};
</script>

<style scoped lang="scss">
/* ===================== start screen ===================== */
.word-home {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  height: 100%;
  min-height: 0;
  padding: var(--space-4) var(--space-4) var(--space-2);
}
.word-home__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.word-home__header h1 {
  margin-top: 2px;
  font-size: clamp(1.85rem, 2.6vw, 2.4rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
}
.word-home__search {
  width: min(360px, 100%);
}
.word-home__search :deep(.q-field__control) {
  min-height: 42px;
  border-radius: var(--radius-pill);
}
.word-home__label {
  font-family: var(--font-control);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.word-home__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.word-home__section--grow {
  flex: 1;
  min-height: 0;
}

/* templates */
.template-row {
  display: flex;
  gap: var(--space-3);
  overflow-x: auto;
  padding-bottom: 2px;
}
.template-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
}
.template-card__sheet {
  display: grid;
  width: 104px;
  height: 132px;
  place-items: center;
  border: var(--border-thin);
  border-radius: 6px;
  background: var(--color-document-surface);
  color: var(--color-primary);
  font-size: 1.9rem;
  box-shadow: var(--shadow-sm);
  transition:
    transform var(--duration-fast) var(--ease-smooth-out),
    box-shadow var(--duration-fast) var(--ease-smooth-out);
}
.template-card:hover .template-card__sheet {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.template-card__sheet--mint {
  background: var(--brand-mint);
  color: var(--brand-deep);
}
.template-card__sheet--teal {
  background: var(--color-secondary);
  color: var(--color-on-secondary);
}
.template-card__sheet--dark {
  background: var(--color-strong-surface);
  color: var(--color-on-strong-surface);
}
.template-card__name {
  font-family: var(--font-control);
  font-size: 0.75rem;
}

/* folders */
.folder-row {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: 2px;
}
.folder-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 150px;
  flex-shrink: 0;
  padding: var(--space-2) var(--space-3);
  border: var(--border-thin);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}
.folder-card:hover {
  background: var(--color-surface-soft);
}
.folder-card--active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}
.folder-card--new {
  border-style: dashed;
  color: var(--color-primary);
}
.folder-card .q-icon {
  font-size: 1.25rem;
  color: var(--color-primary);
}
.folder-card__name {
  font-family: var(--font-control);
  font-size: 0.82rem;
  font-weight: 700;
}
.folder-card small {
  font-size: 0.68rem;
  color: var(--color-text-muted);
}
.folder-card__menu {
  position: absolute;
  top: 4px;
  right: 4px;
}
.folder-card__rename {
  width: 100%;
  padding: 2px 6px;
  border: 1px solid var(--color-primary);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text);
  font-family: var(--font-control);
  font-size: 0.82rem;
}
.folder-card__rename:focus {
  outline: none;
}

/* recent list */
.word-home__listhead {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.doc-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border: var(--border-thin);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}
.doc-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
}
.doc-row + .doc-row {
  border-top: 1px solid color-mix(in srgb, var(--color-border) 40%, transparent);
}
.doc-row:hover {
  background: var(--color-surface-soft);
}
.doc-row__icon {
  color: var(--color-primary);
  font-size: 1.3rem;
}
.doc-row__name {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.doc-row__name strong {
  overflow: hidden;
  font-family: var(--font-control);
  font-size: 0.88rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.doc-row__name small {
  overflow: hidden;
  font-size: 0.72rem;
  color: var(--color-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.doc-row__pin {
  color: var(--color-primary);
  font-size: 1rem;
}
.doc-row__folder {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
  font-family: var(--font-control);
  font-size: 0.7rem;
}
.doc-row__when {
  flex-shrink: 0;
  width: 92px;
  text-align: right;
  font-family: var(--font-control);
  font-size: 0.72rem;
  color: var(--color-text-muted);
}
.word-home__empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--color-text-muted);
}
.word-home__empty .q-icon {
  font-size: 3rem;
}
.word-menu {
  min-width: 200px;
}

/* ===================== editor (Word chrome) ===================== */
.word-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border: var(--border-thin);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.word-titlebar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--space-3);
  min-height: 44px;
  padding: 0 var(--space-3);
  color: var(--color-on-strong-surface);
  background: var(--color-strong-surface);
}
.word-titlebar__left,
.word-titlebar__right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.word-titlebar__right {
  justify-content: flex-end;
}
.word-titlebar__autosave {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-control);
  font-size: 0.72rem;
  opacity: 0.85;
}
.word-titlebar__title {
  min-width: 0;
  max-width: 360px;
  padding: 4px 10px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font-family: var(--font-control);
  font-size: 0.9rem;
  text-align: center;
}
.word-titlebar__title:hover,
.word-titlebar__title:focus {
  border-color: color-mix(in srgb, var(--color-on-strong-surface) 40%, transparent);
  outline: none;
}
.word-titlebar__saved {
  font-family: var(--font-control);
  font-size: 0.72rem;
  opacity: 0.75;
}
.word-titlebar .q-btn {
  color: var(--color-on-strong-surface);
}
.word-tabs {
  display: flex;
  gap: 2px;
  padding: 4px var(--space-3) 0;
  background: var(--color-surface);
}
.word-tab {
  padding: 6px 14px;
  border-radius: 8px 8px 0 0;
  font-family: var(--font-control);
  font-size: 0.82rem;
  color: var(--color-text);
}
.word-tab--file {
  color: var(--color-on-primary);
  background: var(--color-primary);
}
.word-tab--active {
  font-weight: 700;
  background: var(--color-surface-soft);
}
.word-body {
  display: flex;
  flex: 1;
  min-height: 0;
  border-top: var(--border-thin);
}
.word-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 232px;
  flex-shrink: 0;
  padding: var(--space-3) var(--space-2);
  border-right: var(--border-thin);
  overflow: hidden;
}
.word-sidebar__search :deep(.q-field__control) {
  min-height: 36px;
  border-radius: 8px;
}
.word-sidebar__new {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px 10px;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  font-family: var(--font-control);
  font-size: 0.8rem;
  color: var(--color-primary);
}
.word-sidebar__new:hover {
  background: var(--color-surface-soft);
}
.word-sidebar__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.word-doc {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  text-align: left;
  color: var(--color-text);
}
.word-doc:hover {
  background: var(--color-surface-soft);
}
.word-doc--active {
  background: color-mix(in srgb, var(--color-primary) 14%, transparent);
}
.word-doc__icon {
  margin-top: 2px;
  color: var(--color-primary);
}
.word-doc__pin {
  margin-top: 2px;
  margin-left: auto;
  color: var(--color-primary);
  font-size: 0.9rem;
}
.word-doc__text {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.word-doc__text strong {
  overflow: hidden;
  font-family: var(--font-control);
  font-size: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.word-doc__text small {
  font-size: 0.68rem;
  color: var(--color-text-muted);
}
.word-canvas {
  position: relative;
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
}
.word-editor {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  border: 0;
  background: transparent;
}
.word-editor :deep(.q-editor__toolbars-container) {
  position: sticky;
  top: 0;
  z-index: 5;
  flex-shrink: 0;
  padding: 4px var(--space-2);
  border-bottom: var(--border-thin);
  background: var(--color-surface);
}
.word-editor :deep(.q-editor__content) {
  flex: 1;
  overflow-y: auto;
  background: color-mix(in srgb, var(--color-text) 8%, var(--color-background));
  padding: var(--space-5) var(--space-3);
}
.word-editor :deep(.word-sheet) {
  width: min(816px, 100%);
  min-height: 1056px;
  margin: 0 auto;
  padding: clamp(40px, 8vw, 96px);
  border: 1px solid var(--color-document-border);
  border-radius: 2px;
  background: var(--color-document-surface);
  color: var(--color-document-text);
  box-shadow: var(--shadow-document);
  font-family: Calibri, 'Segoe UI', Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.5;
}
.word-canvas__empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--color-text-muted);
}
.word-canvas__empty .q-icon {
  font-size: 3rem;
}
.word-statusbar {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  min-height: 26px;
  padding: 0 var(--space-3);
  border-top: var(--border-thin);
  background: var(--color-strong-surface);
  color: var(--color-on-strong-surface);
  font-family: var(--font-control);
  font-size: 0.7rem;
}
.word-statusbar__right {
  margin-left: auto;
}

@media (max-width: 800px) {
  .word-sidebar {
    display: none;
  }
  .word-editor :deep(.word-sheet) {
    min-height: 60vh;
    padding: clamp(20px, 6vw, 40px);
    border-radius: 0;
  }
  .doc-row__folder {
    display: none;
  }

  /* Title bar: drop the redundant status text (the status bar already shows
     it) so back / title / print fit one clean row. */
  .word-titlebar {
    grid-template-columns: auto 1fr auto;
    gap: var(--space-2);
    padding: 0 var(--space-2);
  }
  .word-titlebar__autosave,
  .word-titlebar__saved {
    display: none;
  }
  .word-titlebar__title {
    max-width: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Ribbon: scroll horizontally instead of wrapping / clipping. */
  .word-editor :deep(.q-editor__toolbar) {
    flex-wrap: nowrap;
  }
  .word-editor :deep(.q-editor__content) {
    padding: var(--space-3) 0;
  }

  /* Status bar: let items breathe, drop the least useful one. */
  .word-statusbar {
    gap: var(--space-3);
    font-size: 0.66rem;
  }
  .word-statusbar span:nth-child(3) {
    display: none;
  }
}
</style>

<style lang="scss">
/* Print only the document sheet (unscoped so it can reach the app shell). */
@media print {
  body * {
    visibility: hidden;
  }
  .word-sheet,
  .word-sheet * {
    visibility: visible;
  }
  .word-sheet {
    position: absolute;
    inset: 0 auto auto 0;
    width: 100%;
    min-height: 0;
    border: 0;
    box-shadow: none;
  }
}
</style>
