<template>
  <q-dialog v-model="open" class="command-dialog" @show="onShow">
    <q-card class="command-palette" aria-label="Command palette">
      <div class="command-palette__search">
        <q-icon name="search" aria-hidden="true" />
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          class="command-palette__input"
          :placeholder="mode === 'create' ? 'What do you want to create?' : 'Search commands, pages, and data…'"
          role="combobox"
          aria-label="Search commands"
          aria-expanded="true"
          aria-controls="command-listbox"
          :aria-activedescendant="activeId"
          @keydown.down.prevent="move(1)"
          @keydown.up.prevent="move(-1)"
          @keydown.enter.prevent="runActive"
          @keydown.esc="close"
        />
        <kbd class="command-palette__hint">Esc</kbd>
      </div>

      <div id="command-listbox" ref="listRef" class="command-palette__list" role="listbox">
        <template v-if="sections.length">
          <div v-for="section in sections" :key="section.label" class="command-group">
            <p class="command-group__label">{{ section.label }}</p>
            <button
              v-for="item in section.items"
              :id="`cmd-${item.id}`"
              :key="item.id"
              type="button"
              class="command-item"
              :class="{
                'command-item--active': flatIndex(item) === activeIndex,
                'command-item--disabled': item.enabled === false,
              }"
              role="option"
              :aria-selected="flatIndex(item) === activeIndex"
              :aria-disabled="item.enabled === false || undefined"
              :data-index="flatIndex(item)"
              @click="run(item)"
              @mousemove="activeIndex = flatIndex(item)"
            >
              <q-icon :name="item.icon" class="command-item__icon" aria-hidden="true" />
              <span class="command-item__text">
                <span class="command-item__label">{{ item.label }}</span>
                <span
                  v-if="item.description || item.disabledReason"
                  class="command-item__desc"
                >
                  {{ item.enabled === false ? item.disabledReason : item.description }}
                </span>
              </span>
              <span v-if="item.enabled === false" class="command-item__badge">Soon</span>
              <kbd v-else-if="item.shortcut" class="command-item__shortcut">{{ item.shortcut }}</kbd>
            </button>
          </div>
        </template>
        <div v-else class="command-empty">
          <q-icon name="search_off" aria-hidden="true" />
          <p>No results for “{{ query }}”</p>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useUiStore } from '@/stores/ui.store';
import { useCommandPalette } from '@/composables/useCommandPalette';
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts';
import { buildCommands, quickAddOptions, searchWorkspace } from '@/data/command.registry';
import type { Command, CommandContext, CommandGroup, QuickAddType } from '@/types/command.types';

const router = useRouter();
const ui = useUiStore();
const $q = useQuasar();
const { open, mode, query, recentIds, close, rememberCommand } = useCommandPalette();

useKeyboardShortcuts();

const GROUP_ORDER: CommandGroup[] = [
  'Pages',
  'Create',
  'Tasks',
  'Notes',
  'Projects',
  'Calendar',
  'Actions',
];

function quickAdd(type: QuickAddType) {
  const option = quickAddOptions.find((o) => o.type === type);
  if (!option || option.comingSoon || !option.route) {
    $q.notify({ message: `${option?.label ?? 'This'} isn’t available yet`, timeout: 1500 });
    return;
  }
  void router.push(option.route);
}

const ctx: CommandContext = {
  navigate: (path) => void router.push(path),
  toggleTheme: () => ui.toggleTheme(),
  quickAdd,
  comingSoon: (label) => $q.notify({ message: `${label} isn’t available yet`, timeout: 1500 }),
};

const allCommands = computed(() => buildCommands(ctx));

const visible = computed<Command[]>(() => {
  const pool =
    mode.value === 'create'
      ? allCommands.value.filter((c) => c.group === 'Create')
      : allCommands.value;
  const q = query.value.trim().toLowerCase();
  if (!q) return pool;
  const matched = pool.filter((c) =>
    [c.label, c.description ?? '', ...(c.keywords ?? [])].join(' ').toLowerCase().includes(q),
  );
  return mode.value === 'all' ? [...matched, ...searchWorkspace(query.value, ctx)] : matched;
});

const recentItems = computed<Command[]>(() => {
  if (query.value.trim() || mode.value !== 'all') return [];
  return recentIds.value
    .map((id) => allCommands.value.find((c) => c.id === id))
    .filter((c): c is Command => Boolean(c));
});

const sections = computed<{ label: string; items: Command[] }[]>(() => {
  const out: { label: string; items: Command[] }[] = [];
  const recentIdSet = new Set(recentItems.value.map((c) => c.id));
  if (recentItems.value.length) out.push({ label: 'Recent', items: recentItems.value });
  for (const group of GROUP_ORDER) {
    const items = visible.value.filter((c) => c.group === group && !recentIdSet.has(c.id));
    if (items.length) out.push({ label: group, items });
  }
  return out;
});

const flat = computed(() => sections.value.flatMap((s) => s.items));
const activeIndex = ref(0);
const activeId = computed(() => {
  const item = flat.value[activeIndex.value];
  return item ? `cmd-${item.id}` : undefined;
});

// n is small (< ~50 visible), so indexOf is fine. ponytail: linear scan, add an
// id→index map if the registry ever grows large.
function flatIndex(item: Command) {
  return flat.value.indexOf(item);
}

function firstEnabled(): number {
  const i = flat.value.findIndex((c) => c.enabled !== false);
  return i === -1 ? 0 : i;
}

watch([visible, recentItems], () => {
  activeIndex.value = firstEnabled();
});

function move(delta: number) {
  const items = flat.value;
  if (!items.length) return;
  let i = activeIndex.value;
  for (let step = 0; step < items.length; step += 1) {
    i = (i + delta + items.length) % items.length;
    if (items[i]?.enabled !== false) break;
  }
  activeIndex.value = i;
  void nextTick(scrollActive);
}

function scrollActive() {
  listRef.value
    ?.querySelector<HTMLElement>(`[data-index="${activeIndex.value}"]`)
    ?.scrollIntoView({ block: 'nearest' });
}

function run(item: Command) {
  if (item.enabled === false) {
    $q.notify({ message: item.disabledReason ?? 'Not available yet', timeout: 1500 });
    return;
  }
  rememberCommand(item.id);
  close();
  item.execute();
}

function runActive() {
  const item = flat.value[activeIndex.value];
  if (item) run(item);
}

const inputRef = ref<HTMLInputElement | null>(null);
const listRef = ref<HTMLElement | null>(null);

function onShow() {
  activeIndex.value = firstEnabled();
  void nextTick(() => inputRef.value?.focus());
}
</script>

<style scoped lang="scss">
.command-dialog :deep(.q-dialog__inner) {
  align-items: flex-start;
  padding-top: 12vh;
}
.command-palette {
  display: flex;
  width: min(640px, 92vw);
  max-height: 68vh;
  flex-direction: column;
  overflow: hidden;
  color: var(--color-text);
  background: var(--color-surface);
  border: var(--border-thin);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
.command-palette__search {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-bottom: var(--border-thin);
}
.command-palette__search > .q-icon {
  font-size: 1.25rem;
  color: var(--color-text-muted);
}
.command-palette__input {
  flex: 1;
  min-width: 0;
  color: var(--color-text);
  font-family: var(--font-control);
  font-size: 1rem;
  background: none;
  border: none;
  outline: none;
}
.command-palette__input::placeholder {
  color: var(--color-text-muted);
}
.command-palette__hint,
.command-item__shortcut {
  padding: 2px var(--space-2);
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.66rem;
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
  border-radius: var(--radius-sm);
}
.command-palette__list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}
.command-group + .command-group {
  margin-top: var(--space-2);
}
.command-group__label {
  padding: var(--space-1) var(--space-2);
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.command-item {
  display: flex;
  width: 100%;
  min-height: 44px;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  color: var(--color-text);
  text-align: left;
  border-radius: var(--radius-sm);
}
.command-item--active {
  background: color-mix(in srgb, var(--color-primary) 16%, transparent);
}
.command-item--disabled {
  cursor: default;
  opacity: 0.55;
}
.command-item__icon {
  font-size: 1.2rem;
  color: var(--color-text-secondary);
}
.command-item--active .command-item__icon {
  color: var(--color-primary);
}
.command-item__text {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.command-item__label {
  overflow: hidden;
  font-size: 0.9rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.command-item__desc {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.command-item__badge {
  padding: 2px var(--space-2);
  color: var(--color-warning);
  font-family: var(--font-control);
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  background: color-mix(in srgb, var(--color-warning) 16%, transparent);
  border-radius: var(--radius-pill);
}
.command-empty {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--space-2);
  color: var(--color-text-muted);
}
.command-empty > .q-icon {
  font-size: 2rem;
}
</style>
