<template>
  <article class="dashboard-card today-tasks-card">
    <header class="dashboard-card__header">
      <div>
        <p class="dashboard-eyebrow">Today</p>
        <h2>Today’s tasks</h2>
      </div>
      <span class="today-tasks-card__count">{{ completedCount }}/{{ todayList.length }}</span>
    </header>

    <div v-if="loading && !initialized" class="today-tasks-card__list" aria-busy="true">
      <AppSkeleton v-for="n in 3" :key="n" variant="text" :lines="1" height="44px" />
    </div>
    <div v-else-if="!todayList.length" class="today-tasks-card__empty">
      <q-icon name="task_alt" />
      <span>No tasks for today. Enjoy the calm.</span>
    </div>
    <div v-else class="today-tasks-card__list">
      <label
        v-for="task in visibleTasks"
        :key="task.id"
        class="task-row"
        :class="{ 'task-row--completed': task.completed }"
      >
        <q-checkbox
          :model-value="task.completed"
          color="primary"
          :aria-label="task.title"
          @update:model-value="toggleComplete(task)"
        />
        <span class="task-row__content">
          <span class="task-row__title" :class="{ 'task-row__title--done': task.completed }">
            {{ task.title }}
          </span>
          <small>{{ task.project }}</small>
        </span>
      </label>
    </div>

    <footer class="today-tasks-card__footer">
      <span>{{ remainingCount }} remaining</span>
      <q-btn
        flat
        dense
        no-caps
        rounded
        icon-right="arrow_forward"
        label="View all"
        to="/tasks"
        aria-label="Open all tasks"
      />
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import { useTasks } from '@/modules/tasks/composables/useTasks';

const { tasks, loading, initialized, initialize, toggleComplete } = useTasks();

// initialize() is a no-op if the store is already loaded (auth wiring runs it on sign-in).
onMounted(() => void initialize());

function isToday(iso: string | null) {
  if (!iso) return false;
  const date = new Date(iso);
  return date.toDateString() === new Date().toDateString();
}

const todayList = computed(() => {
  const active = tasks.value.filter((task) => task.status === 'Today');
  const doneToday = tasks.value.filter((task) => task.completed && isToday(task.completedAt));
  // Highest-priority first among the open ones, completed after.
  const rank = { High: 0, Medium: 1, Low: 2 } as const;
  active.sort((a, b) => rank[a.priority] - rank[b.priority]);
  return [...active, ...doneToday];
});
const completedCount = computed(() => todayList.value.filter((task) => task.completed).length);
const remainingCount = computed(() => todayList.value.length - completedCount.value);
const visibleTasks = computed(() => todayList.value.slice(0, 4));
</script>

<style scoped lang="scss">
.today-tasks-card {
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-surface);
}

.today-tasks-card h2 {
  margin: 2px 0 0;
  font-size: clamp(1.125rem, 1.5vw, 1.375rem);
  font-weight: 700;
}

.today-tasks-card__count {
  font-family: var(--font-heading);
  font-size: clamp(1.5rem, 2vw, 1.9rem);
  font-weight: 700;
}

.today-tasks-card__list {
  display: grid;
  align-content: start;
  gap: var(--space-1);
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.today-tasks-card__empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.78rem;
  text-align: center;
}
.today-tasks-card__empty .q-icon {
  font-size: 1.8rem;
  color: var(--color-primary);
}

.task-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: 4px var(--space-2);
  border: var(--border-thin);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  background: var(--color-surface-raised);
  cursor: pointer;
}

.task-row__content {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.task-row__title {
  min-width: 0;
  overflow: hidden;
  font-size: 0.82rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-row__content small {
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.62rem;
}

.task-row__title--done {
  opacity: 0.55;
  text-decoration: line-through;
}

.today-tasks-card__footer {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.7rem;
}

.today-tasks-card__footer .q-btn {
  color: var(--color-primary);
}
</style>
