<template>
  <q-dialog
    :model-value="modelValue"
    :maximized="$q.screen.lt.sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="note-editor">
      <q-card-section class="note-editor__header">
        <div>
          <p class="text-caption">{{ note ? 'Editing note' : 'New note' }}</p>
          <h2 class="text-section-title">{{ draft.title || 'Untitled note' }}</h2>
        </div>
        <span class="note-editor__status font-interactive" role="status" aria-live="polite">
          {{ saveStatus }}
        </span>
      </q-card-section>

      <q-separator />

      <q-card-section class="note-editor__body">
        <q-input
          v-model="draft.title"
          outlined
          label="Title"
          maxlength="500"
          autofocus
          class="font-body"
        />
        <q-input
          v-model="draft.content"
          outlined
          autogrow
          type="textarea"
          label="Note"
          hint="Markdown formatting is supported."
          class="note-editor__content font-body"
        />
        <q-select
          v-model="draft.tags"
          outlined
          multiple
          use-input
          use-chips
          hide-dropdown-icon
          new-value-mode="add-unique"
          :options="[]"
          label="Tags"
          hint="Type a tag and press Enter."
          class="font-body"
        />

        <q-expansion-item
          icon="tune"
          label="Properties"
          caption="Add only the details you need"
          class="note-editor__properties font-interactive"
        >
          <div class="note-editor__property-list">
            <div v-for="field in propertyFields" :key="field.id" class="note-editor__property">
              <q-input v-model="field.name" outlined dense label="Name" class="font-body" />
              <q-select
                v-model="field.type"
                outlined
                dense
                emit-value
                map-options
                :options="propertyTypes"
                label="Type"
                class="font-body"
              />
              <q-toggle
                v-if="field.type === 'checkbox'"
                :model-value="Boolean(field.value)"
                label="Checked"
                @update:model-value="field.value = $event"
              />
              <q-input
                v-else
                :model-value="inputValue(field.value)"
                outlined
                dense
                :type="inputType(field.type)"
                :min="field.type === 'rating' ? 0 : undefined"
                :max="field.type === 'rating' ? 5 : undefined"
                label="Value"
                class="font-body"
                @update:model-value="field.value = coerceValue(field.type, $event)"
              />
              <q-btn
                flat
                round
                dense
                icon="close"
                aria-label="Remove property"
                @click="removeProperty(field.id)"
              />
            </div>
            <q-btn
              flat
              no-caps
              icon="add"
              label="Add property"
              class="font-interactive"
              @click="addProperty"
            />
          </div>
        </q-expansion-item>
      </q-card-section>

      <q-separator />

      <q-card-actions align="between" class="note-editor__actions">
        <q-toggle v-model="draft.pinned" label="Pinned" class="font-interactive" />
        <div class="note-editor__buttons">
          <q-btn flat no-caps label="Close" class="font-interactive" @click="close" />
          <AppButton :loading="saving" @click="save(true)">
            {{ note ? 'Save' : 'Create note' }}
          </AppButton>
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import type { NoteDraft, NoteWithTags } from '@/stores/notes.store';
import type { Json } from '@/types/database.types';

type PropertyType =
  | 'status'
  | 'priority'
  | 'category'
  | 'start_date'
  | 'due_date'
  | 'rating'
  | 'checkbox'
  | 'text'
  | 'number'
  | 'url';

interface PropertyField {
  id: string;
  name: string;
  type: PropertyType;
  value: string | number | boolean | null;
}

const props = defineProps<{
  error: string;
  modelValue: boolean;
  note: NoteWithTags | null;
  saving: boolean;
}>();

const emit = defineEmits<{
  save: [draft: NoteDraft, closeAfterSave: boolean];
  'update:modelValue': [value: boolean];
}>();

const draft = reactive<Omit<NoteDraft, 'properties'>>({
  content: '',
  pinned: false,
  tags: [],
  title: '',
});
const propertyFields = ref<PropertyField[]>([]);
const dirty = ref(false);
const saved = ref(false);
const resetting = ref(false);
let autosaveTimer: ReturnType<typeof setTimeout> | undefined;

const propertyTypes: { label: string; value: PropertyType }[] = [
  { label: 'Status', value: 'status' },
  { label: 'Priority', value: 'priority' },
  { label: 'Category', value: 'category' },
  { label: 'Start date', value: 'start_date' },
  { label: 'Due date', value: 'due_date' },
  { label: 'Rating', value: 'rating' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'Text', value: 'text' },
  { label: 'Number', value: 'number' },
  { label: 'URL', value: 'url' },
];

const saveStatus = computed(() => {
  if (props.saving) return 'Saving…';
  if (props.error) return 'Could not save';
  if (saved.value) return 'Saved';
  return dirty.value ? 'Unsaved changes' : '';
});

function inputValue(value: PropertyField['value']): string | number | null {
  return typeof value === 'boolean' ? null : value;
}

function readProperties(properties: Json): PropertyField[] {
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) return [];
  const fields = properties.fields;
  if (!Array.isArray(fields)) return [];
  return fields.flatMap((field) => {
    if (!field || typeof field !== 'object' || Array.isArray(field)) return [];
    if (typeof field.name !== 'string' || typeof field.type !== 'string') return [];
    return [
      {
        id: crypto.randomUUID(),
        name: field.name,
        type: field.type as PropertyType,
        value: (field.value as string | number | boolean | null) ?? '',
      },
    ];
  });
}

function reset() {
  resetting.value = true;
  clearTimeout(autosaveTimer);
  draft.title = props.note?.title ?? '';
  draft.content = props.note?.content ?? '';
  draft.pinned = props.note?.pinned ?? false;
  draft.tags = props.note?.tags.map((tag) => tag.name) ?? [];
  propertyFields.value = readProperties(props.note?.properties ?? {});
  dirty.value = false;
  saved.value = false;
  void nextTick(() => {
    resetting.value = false;
  });
}

function serializableDraft(): NoteDraft {
  return {
    content: draft.content,
    pinned: draft.pinned,
    properties: serializableProperties(),
    tags: draft.tags.map((tag) => tag.trim()).filter(Boolean),
    title: draft.title,
  };
}

function serializableProperties(): Json {
  return {
    fields: propertyFields.value
      .filter((field) => field.name.trim())
      .map(({ name, type, value }) => ({ name: name.trim(), type, value })),
  };
}

function save(closeAfterSave: boolean) {
  clearTimeout(autosaveTimer);
  if (!draft.title.trim()) return;
  dirty.value = false;
  saved.value = true;
  emit('save', serializableDraft(), closeAfterSave);
}

function close() {
  if (props.note && dirty.value && draft.title.trim()) save(false);
  emit('update:modelValue', false);
}

function addProperty() {
  propertyFields.value.push({ id: crypto.randomUUID(), name: '', type: 'text', value: '' });
}

function removeProperty(id: string) {
  propertyFields.value = propertyFields.value.filter((field) => field.id !== id);
}

function inputType(type: PropertyType) {
  if (type === 'start_date' || type === 'due_date') return 'date';
  if (type === 'number' || type === 'rating') return 'number';
  if (type === 'url') return 'url';
  return 'text';
}

function coerceValue(type: PropertyType, value: string | number | null) {
  return type === 'number' || type === 'rating'
    ? value === '' || value === null
      ? null
      : Number(value)
    : value;
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) reset();
  },
);

watch(
  () => [draft.title, draft.content, draft.pinned, draft.tags, propertyFields.value] as const,
  () => {
    if (!props.modelValue || resetting.value) return;
    dirty.value = true;
    saved.value = false;
    clearTimeout(autosaveTimer);
    if (props.note && draft.title.trim()) autosaveTimer = setTimeout(() => save(false), 900);
  },
  { deep: true },
);

onBeforeUnmount(() => clearTimeout(autosaveTimer));
</script>

<style scoped lang="scss">
.note-editor {
  display: flex;
  flex-direction: column;
  width: min(760px, 94vw);
  max-width: 760px;
  max-height: min(880px, 92vh);
  color: var(--color-text);
  background: var(--color-surface);
}
.note-editor__header,
.note-editor__actions,
.note-editor__buttons,
.note-editor__property {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}
.note-editor__header {
  justify-content: space-between;
}
.note-editor__status {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}
.note-editor__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-lg);
  overflow: auto;
}
.note-editor__content :deep(textarea) {
  min-height: 260px;
  line-height: 1.6;
}
.note-editor__properties {
  border: var(--border-thin);
  border-radius: var(--radius-sm);
}
.note-editor__property-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: 0 var(--space-md) var(--space-md);
}
.note-editor__property {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(110px, 0.7fr) minmax(140px, 1fr) auto;
}
.note-editor__actions {
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
}

@media (max-width: 599px) {
  .note-editor {
    width: 100%;
    max-width: none;
    max-height: none;
  }
  .note-editor__property {
    grid-template-columns: 1fr auto;
  }
  .note-editor__property > :nth-child(1),
  .note-editor__property > :nth-child(2),
  .note-editor__property > :nth-child(3) {
    grid-column: 1;
  }
  .note-editor__property > :last-child {
    grid-column: 2;
    grid-row: 1;
  }
}
</style>
