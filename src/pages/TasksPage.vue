<template>
  <main class="dashboard-content-page tasks-page">
    <DashboardPageHeader
      eyebrow="Task management"
      title="Tasks"
      description="Plan the next useful action without losing sight of today."
    >
      <template #action>
        <AppButton variant="dark" icon-left="add" @click="openCreate">Add task</AppButton>
      </template>
    </DashboardPageHeader>

    <section class="task-stats" aria-label="Task overview">
      <AppCard v-for="stat in taskStats" :key="stat.label" class="task-stat" padding="small">
        <span>{{ stat.label }}</span
        ><strong>{{ stat.value }}</strong
        ><small>{{ stat.detail }}</small>
      </AppCard>
    </section>

    <div class="workspace-toolbar tasks-toolbar">
      <nav class="dashboard-pill-nav" aria-label="Task filters">
        <button
          v-for="filter in filters"
          :key="filter"
          type="button"
          class="dashboard-pill"
          :class="{ 'dashboard-pill--active': activeFilter === filter }"
          :aria-pressed="activeFilter === filter"
          @click="setFilter(filter)"
        >
          {{ filter }}
        </button>
      </nav>
      <DataSyncStatus
        class="tasks-toolbar__sync"
        :online="online"
        :saving="saving"
        :error="error"
        :last-synced-at="lastSyncedAt"
      />
      <q-input
        v-model="search"
        dense
        outlined
        clearable
        label="Search tasks"
        class="workspace-toolbar__search"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <q-select
        v-model="sort"
        dense
        outlined
        emit-value
        map-options
        :options="sortOptions"
        label="Sort"
        class="tasks-toolbar__sort"
      />
    </div>

    <section class="tasks-workspace workspace-panel">
      <AppCard class="task-panel" padding="none" radius="lg">
        <div class="task-list-heading" aria-hidden="true">
          <span>Task</span><span>Priority</span><span>Deadline</span><span />
        </div>
        <div v-if="loading && !initialized" class="task-list task-list--loading" aria-busy="true">
          <div v-for="n in 5" :key="n" class="task-skeleton-row">
            <AppSkeleton variant="circular" width="22px" height="22px" />
            <AppSkeleton variant="text" :lines="2" />
          </div>
        </div>
        <div v-else-if="loadFailed" class="workspace-empty">
          <AppEmptyState
            icon="cloud_off"
            title="Couldn’t load your tasks"
            description="Check your connection and try again."
          >
            <template #action>
              <AppButton icon-left="refresh" :loading="loading" @click="retry">Retry</AppButton>
            </template>
          </AppEmptyState>
        </div>
        <div v-else-if="pageTasks.length" class="workspace-scroll task-list">
          <article
            v-for="task in pageTasks"
            :key="task.id"
            class="task-row"
            :class="{ 'task-row--done': task.completed }"
          >
            <q-checkbox
              :model-value="task.completed"
              :aria-label="`Mark ${task.title} complete`"
              @update:model-value="toggleTask(task)"
            />
            <button type="button" class="task-row__open" @click="openTask(task)">
              <span class="task-row__summary"
                ><strong>{{ task.title }}</strong
                ><small>{{ task.project }}</small></span
              >
              <AppBadge :variant="priorityVariant(task.priority)" size="compact">{{
                task.priority
              }}</AppBadge>
              <span class="task-row__due"><q-icon name="schedule" />{{ task.due }}</span>
              <q-icon name="chevron_right" aria-hidden="true" />
            </button>
            <q-btn
              flat
              round
              dense
              icon="more_vert"
              class="task-row__menu"
              :aria-label="`Options for ${task.title}`"
            >
              <q-menu anchor="bottom right" self="top right" auto-close>
                <q-list dense style="min-width: 150px">
                  <q-item clickable @click="openTask(task)"
                    ><q-item-section>Open</q-item-section></q-item
                  >
                  <q-item clickable @click="startEdit(task)"
                    ><q-item-section>Edit</q-item-section></q-item
                  >
                  <q-item clickable @click="toggleTask(task)"
                    ><q-item-section>{{
                      task.completed ? 'Mark incomplete' : 'Mark complete'
                    }}</q-item-section></q-item
                  >
                  <q-separator />
                  <q-item
                    v-close-popup
                    clickable
                    :disable="saving"
                    class="text-negative"
                    @click="deleteTask(task)"
                    ><q-item-section>Delete</q-item-section></q-item
                  >
                </q-list>
              </q-menu>
            </q-btn>
          </article>
        </div>
        <div v-else class="workspace-empty">
          <AppEmptyState
            v-if="tasks.length"
            icon="search_off"
            title="No matching tasks"
            description="Try a different filter or search term."
          />
          <AppEmptyState
            v-else
            icon="task_alt"
            title="No tasks yet"
            description="Add your first task to start planning your day."
          >
            <template #action>
              <AppButton icon-left="add" @click="openCreate">Add task</AppButton>
            </template>
          </AppEmptyState>
        </div>
        <footer class="task-panel__footer">
          <span class="workspace-meta">{{ filteredTasks.length }} tasks · page {{ page }}</span>
          <q-pagination
            v-model="page"
            :max="pageCount"
            :max-pages="4"
            direction-links
            boundary-links
            size="sm"
          />
        </footer>
      </AppCard>

      <aside class="task-insights" aria-label="Today's task insights">
        <AppCard class="today-plan" variant="dark" padding="small" radius="lg">
          <header>
            <div>
              <p class="dashboard-eyebrow">Today’s plan</p>
              <h2>Make today count</h2>
            </div>
            <q-icon name="today" />
          </header>
          <div class="today-plan__progress">
            <div
              class="today-plan__ring"
              :style="{ '--task-progress': `${todayProgress * 3.6}deg` }"
              role="img"
              :aria-label="`${todayProgress}% of today's tasks complete`"
            >
              <span
                ><strong>{{ todayProgress }}%</strong><small>complete</small></span
              >
            </div>
            <div>
              <strong>{{ todayCompleted }}/{{ todaySchedule.length }}</strong>
              <span>tasks completed</span>
              <small>{{ todaySchedule.length - todayCompleted }} still need attention</small>
            </div>
          </div>
          <div v-if="nextTask" class="next-task">
            <span>Next up · {{ nextTask.due }}</span>
            <strong>{{ nextTask.title }}</strong>
            <small>{{ nextTask.project }} · {{ nextTask.priority }} priority</small>
            <AppButton size="small" @click="openTask(nextTask)">Open task</AppButton>
          </div>
          <div v-else class="next-task next-task--done">
            <q-icon name="celebration" /><strong>Today is complete</strong>
          </div>
        </AppCard>

        <AppCard class="priority-card" padding="small" radius="lg">
          <header>
            <div>
              <p class="dashboard-eyebrow">Workload</p>
              <h2>Priority balance</h2>
            </div>
            <AppBadge variant="neutral" size="compact">{{ activeTasks.length }} active</AppBadge>
          </header>
          <div class="priority-list">
            <div v-for="item in prioritySummary" :key="item.label">
              <span
                ><strong>{{ item.label }}</strong
                ><small>{{ item.count }} tasks</small></span
              >
              <AppProgress :value="item.percent" :variant="item.variant" />
            </div>
          </div>
        </AppCard>
      </aside>
    </section>

    <AppDetailPanel
      v-model="detailOpen"
      eyebrow="Task details"
      :title="mode === 'view' ? (selectedTask?.title ?? 'Task') : editingId ? 'Edit task' : 'New task'"
      :description="
        mode === 'view'
          ? (selectedTask?.description ?? '')
          : 'Capture the next useful action.'
      "
    >
      <dl v-if="mode === 'view' && selectedTask" class="workspace-detail-stack">
        <div class="workspace-detail-row">
          <dt>Project</dt>
          <dd>{{ selectedTask.project }}</dd>
        </div>
        <div class="workspace-detail-row">
          <dt>Deadline</dt>
          <dd>{{ selectedTask.due }}</dd>
        </div>
        <div class="workspace-detail-row">
          <dt>Priority</dt>
          <dd>
            <AppBadge :variant="priorityVariant(selectedTask.priority)">{{
              selectedTask.priority
            }}</AppBadge>
          </dd>
        </div>
        <div class="workspace-detail-row">
          <dt>Status</dt>
          <dd>{{ selectedTask.completed ? 'Completed' : selectedTask.status }}</dd>
        </div>
      </dl>
      <form v-else id="task-form" @submit.prevent="saveTask">
        <label class="workspace-field"
          ><span class="workspace-field__label">Task title</span
          ><q-input v-model="draft.title" outlined autofocus
        /></label>
        <label class="workspace-field"
          ><span class="workspace-field__label">Project</span
          ><q-input v-model="draft.project" outlined
        /></label>
        <label class="workspace-field"
          ><span class="workspace-field__label">Short description</span
          ><q-input v-model="draft.description" outlined type="textarea" autogrow
        /></label>
        <label class="workspace-field"
          ><span class="workspace-field__label">Deadline</span
          ><q-input v-model="draft.due" outlined type="datetime-local"
        /></label>
        <label class="workspace-field"
          ><span class="workspace-field__label">Priority</span
          ><q-select v-model="draft.priority" outlined :options="priorities"
        /></label>
      </form>
      <template #actions>
        <template v-if="mode === 'view' && selectedTask">
          <AppButton variant="ghost" @click="toggleTask(selectedTask)">{{
            selectedTask.completed ? 'Reopen task' : 'Mark complete'
          }}</AppButton>
          <AppButton
            variant="ghost"
            icon-left="delete"
            :disabled="saving"
            @click="deleteTask(selectedTask)"
            >Delete</AppButton
          >
          <AppButton icon-left="edit" @click="startEdit(selectedTask)">Edit</AppButton>
        </template>
        <AppButton
          v-else
          type="submit"
          form="task-form"
          :loading="saving"
          :disabled="!draft.title.trim()"
          >{{ editingId ? 'Save changes' : 'Create task' }}</AppButton
        >
      </template>
    </AppDetailPanel>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppDetailPanel from '@/components/ui/AppDetailPanel.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import AppProgress from '@/components/ui/AppProgress.vue';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader.vue';
import DataSyncStatus from '@/components/shared/DataSyncStatus.vue';
import { useTasks, toDatetimeLocal, type TaskView } from '@/modules/tasks/composables/useTasks';

type TaskFilter = 'All' | 'Today' | 'Upcoming' | 'Completed';
type TaskSort = 'deadline' | 'priority' | 'title';
type PriorityLabel = 'High' | 'Medium' | 'Low';

const {
  tasks,
  loading,
  initialized,
  saving,
  error,
  lastSyncedAt,
  online,
  initialize,
  refresh,
  createTask,
  updateTask,
  removeTask,
  toggleComplete,
} = useTasks();

const filters: TaskFilter[] = ['All', 'Today', 'Upcoming', 'Completed'];
const priorities: PriorityLabel[] = ['High', 'Medium', 'Low'];
const sortOptions = [
  { label: 'Deadline', value: 'deadline' },
  { label: 'Priority', value: 'priority' },
  { label: 'Title', value: 'title' },
];
const activeFilter = ref<TaskFilter>('All');
const search = ref('');
const sort = ref<TaskSort>('deadline');
const page = ref(1);
const pageSize = 6;
const detailOpen = ref(false);
const mode = ref<'view' | 'form'>('view');
const editingId = ref<string | null>(null);
const selectedTask = ref<TaskView | null>(null);
const draft = reactive<{
  title: string;
  project: string;
  description: string;
  due: string;
  priority: PriorityLabel;
}>({
  title: '',
  project: '',
  description: '',
  due: '',
  priority: 'Medium',
});

onMounted(() => void initialize());

// Show the failed-to-load screen only when there is nothing (not even cache) to display.
const loadFailed = computed(() => Boolean(error.value) && initialized.value && !tasks.value.length);

function isToday(iso: string | null) {
  if (!iso) return false;
  const date = new Date(iso);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

const taskStats = computed(() => [
  {
    label: 'Today',
    value: tasks.value.filter((task) => task.status === 'Today').length,
    detail: 'Needs attention',
  },
  {
    label: 'Upcoming',
    value: tasks.value.filter((task) => task.status === 'Upcoming').length,
    detail: 'Next 7 days',
  },
  {
    label: 'Completed',
    value: tasks.value.filter((task) => task.completed).length,
    detail: 'All time',
  },
  {
    label: 'Overdue',
    value: tasks.value.filter(
      (task) => !task.completed && task.dueAt !== null && new Date(task.dueAt) < new Date(),
    ).length,
    detail: 'Review today',
  },
]);
const filteredTasks = computed(() => {
  const query = search.value.trim().toLocaleLowerCase();
  const priorityRank = { High: 0, Medium: 1, Low: 2 } satisfies Record<PriorityLabel, number>;
  return tasks.value
    .filter((task) => activeFilter.value === 'All' || task.status === activeFilter.value)
    .filter((task) => !query || `${task.title} ${task.project}`.toLocaleLowerCase().includes(query))
    .sort((a, b) => {
      if (sort.value === 'title') return a.title.localeCompare(b.title);
      if (sort.value === 'priority') return priorityRank[a.priority] - priorityRank[b.priority];
      // deadline: earliest due first, undated last, then manual order.
      if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt);
      if (a.dueAt) return -1;
      if (b.dueAt) return 1;
      return a.position - b.position;
    });
});
const pageCount = computed(() => Math.max(1, Math.ceil(filteredTasks.value.length / pageSize)));
const pageTasks = computed(() =>
  filteredTasks.value.slice((page.value - 1) * pageSize, page.value * pageSize),
);
const todayActive = computed(() => tasks.value.filter((task) => task.status === 'Today'));
const todayDone = computed(() =>
  tasks.value.filter((task) => task.completed && isToday(task.completedAt)),
);
const todaySchedule = computed(() => [...todayActive.value, ...todayDone.value]);
const todayCompleted = computed(() => todayDone.value.length);
const todayProgress = computed(() =>
  todaySchedule.value.length
    ? Math.round((todayCompleted.value / todaySchedule.value.length) * 100)
    : 0,
);
const nextTask = computed(() => {
  const rank = { High: 0, Medium: 1, Low: 2 } as const;
  return [...todayActive.value].sort((a, b) => rank[a.priority] - rank[b.priority])[0] ?? null;
});
const activeTasks = computed(() => tasks.value.filter((task) => !task.completed));
const priorityTones = {
  High: 'dark',
  Medium: 'teal',
  Low: 'mint',
} as const;
const prioritySummary = computed(() =>
  priorities.map((priority) => {
    const count = activeTasks.value.filter((task) => task.priority === priority).length;
    return {
      label: priority,
      count,
      percent: activeTasks.value.length ? Math.round((count / activeTasks.value.length) * 100) : 0,
      variant: priorityTones[priority],
    };
  }),
);

watch([search, activeFilter, sort], () => (page.value = 1));
watch(pageCount, (count) => {
  if (page.value > count) page.value = count;
});

function setFilter(filter: TaskFilter) {
  activeFilter.value = filter;
}
function retry() {
  void refresh();
}
function priorityVariant(priority: PriorityLabel) {
  return priority === 'High' ? 'dark' : priority === 'Medium' ? 'teal' : 'neutral';
}
function openTask(task: TaskView) {
  selectedTask.value = task;
  mode.value = 'view';
  detailOpen.value = true;
}
function openCreate() {
  selectedTask.value = null;
  editingId.value = null;
  Object.assign(draft, { title: '', project: '', description: '', due: '', priority: 'Medium' });
  mode.value = 'form';
  detailOpen.value = true;
}
function startEdit(task: TaskView) {
  selectedTask.value = task;
  editingId.value = task.id;
  Object.assign(draft, {
    title: task.title,
    project: task.project,
    description: task.description,
    due: toDatetimeLocal(task.dueAt),
    priority: task.priority,
  });
  mode.value = 'form';
  detailOpen.value = true;
}
function toggleTask(task: TaskView) {
  void toggleComplete(task);
}
function deleteTask(task: TaskView) {
  if (selectedTask.value?.id === task.id) detailOpen.value = false;
  void removeTask(task.id);
}
async function saveTask() {
  if (!draft.title.trim()) return;
  const form = { ...draft };
  if (editingId.value !== null && selectedTask.value) {
    await updateTask(editingId.value, form, selectedTask.value.status);
  } else {
    await createTask(form);
  }
  detailOpen.value = false;
}
</script>

<style scoped lang="scss">
.task-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-2);
}
.task-stat {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  min-height: 72px;
}
.task-stat span,
.task-stat small {
  font-family: var(--font-control);
}
.task-stat span {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.task-stat strong {
  grid-row: 1 / 3;
  grid-column: 2;
  font-family: var(--font-heading);
  font-size: 1.85rem;
  font-weight: 700;
}
.task-stat small {
  color: var(--color-text-muted);
  font-family: var(--font-body);
  font-size: 0.7rem;
  font-style: italic;
}
.tasks-toolbar__sort {
  width: 150px;
}
.tasks-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.32fr);
  gap: var(--space-2);
}
.task-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
}
.task-insights {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-rows: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: var(--space-2);
}
.task-insights > .app-card {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.today-plan,
.priority-card {
  display: flex;
  flex-direction: column;
}
.task-insights header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
.task-insights header h2 {
  margin-top: 2px;
  font-size: 1.2rem;
}
.task-insights header > .q-icon {
  font-size: 1.4rem;
}
.today-plan__progress {
  display: grid;
  grid-template-columns: 86px 1fr;
  align-items: center;
  gap: var(--space-3);
}
.today-plan__ring {
  display: grid;
  width: 84px;
  aspect-ratio: 1;
  place-items: center;
  border-radius: 50%;
  background: conic-gradient(
    var(--color-progress-fill) var(--task-progress),
    color-mix(in srgb, currentColor 15%, transparent) 0
  );
}
.today-plan__ring > span {
  display: flex;
  width: 62px;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border-radius: 50%;
  background: var(--color-strong-surface);
}
.today-plan__ring strong {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  line-height: 1;
}
.today-plan__ring small,
.today-plan__progress > div:last-child span,
.today-plan__progress > div:last-child small {
  font-size: 0.64rem;
}
.today-plan__progress > div:last-child {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.today-plan__progress > div:last-child > strong {
  font-family: var(--font-heading);
  font-size: 1.45rem;
  line-height: 1;
}
.today-plan__progress > div:last-child small {
  margin-top: var(--space-1);
  opacity: 0.7;
}
.next-task {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0 var(--space-2);
  margin-top: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, currentColor 7%, transparent);
}
.next-task > span,
.next-task > strong,
.next-task > small {
  grid-column: 1;
}
.next-task > span,
.next-task > small {
  font-size: 0.64rem;
  opacity: 0.72;
}
.next-task > strong {
  margin-block: 2px;
  font-family: var(--font-heading);
  font-size: 0.92rem;
}
.next-task > :deep(.app-btn) {
  grid-row: 1 / 4;
  grid-column: 2;
  color: var(--color-on-focus-card);
  background: var(--color-focus-card);
}
.next-task--done {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  flex-direction: row;
}
.priority-list {
  display: grid;
  gap: var(--space-2);
}
.priority-list > div {
  display: grid;
  gap: var(--space-1);
}
.priority-list > div > span {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  font-size: 0.7rem;
}
.priority-list small {
  color: var(--color-text-muted);
}
.priority-list :deep(.app-progress__track) {
  height: 7px;
}
.task-list-heading {
  display: grid;
  grid-template-columns: 1fr 90px 150px 24px;
  gap: var(--space-3);
  padding: var(--space-2) 98px var(--space-2) 58px;
  border-bottom: var(--border-thin);
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}
.task-list {
  flex: 1;
}
.task-list--loading {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
}
.task-skeleton-row {
  display: grid;
  grid-template-columns: 22px 1fr;
  align-items: center;
  gap: var(--space-3);
  min-height: 58px;
}
.tasks-toolbar__sync {
  margin-inline: var(--space-1) auto;
}
.task-row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 36px;
  align-items: center;
  min-height: 58px;
  padding: 0 var(--space-3);
  border-bottom: var(--border-thin);
}
.task-row__menu {
  color: var(--color-text-muted);
}
.task-row:hover .task-row__menu {
  color: var(--color-text);
}
.task-row:last-child {
  border-bottom: 0;
}
.task-row:hover {
  background: var(--color-surface-soft);
}
.task-row__open {
  display: grid;
  grid-template-columns: 1fr 90px 150px 24px;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  min-height: 56px;
  text-align: left;
}
.task-row__summary {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.task-row__summary strong,
.task-row__summary small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.task-row__summary small,
.task-row__due {
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.72rem;
}
.task-row__due {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.task-row--done .task-row__summary strong {
  opacity: 0.55;
  text-decoration: line-through;
}
.task-panel__footer {
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  border-top: var(--border-thin);
}
@media (max-width: 900px) {
  .tasks-workspace {
    grid-template-columns: 1fr;
    overflow: visible;
  }
  .task-insights {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: none;
  }
  .task-panel {
    min-height: 440px;
  }
  .task-list-heading {
    display: none;
  }
  .task-row__open {
    grid-template-columns: 1fr auto 24px;
  }
  .task-row__due {
    display: none;
  }
}
@media (max-width: 600px) {
  .task-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .tasks-toolbar__sort {
    flex: 1;
    width: auto;
  }
  .tasks-toolbar .dashboard-pill {
    min-width: 0;
    flex: 1 1 auto;
    padding-inline: var(--space-2);
    font-size: 0.78rem;
  }
  .task-panel {
    min-height: 420px;
  }
  .task-insights {
    grid-template-columns: 1fr;
  }
  .task-row__open {
    grid-template-columns: 1fr auto 24px;
  }
  .task-row__open > .app-badge {
    display: none;
  }
  .task-panel__footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
