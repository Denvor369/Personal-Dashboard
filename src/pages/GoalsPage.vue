<template>
  <main class="dashboard-content-page goals-page">
    <DashboardPageHeader
      eyebrow="Personal direction"
      title="Goals & Roadmap"
      description="Turn long-term ambitions into milestones and practical next steps."
    >
      <template #action>
        <AppButton variant="dark" icon-left="add" @click="openCreate">Create goal</AppButton>
      </template>
    </DashboardPageHeader>

    <section class="hub-stats" aria-label="Goals overview">
      <AppCard v-for="stat in stats" :key="stat.label" class="hub-stat" padding="small">
        <span>{{ stat.label }}</span><strong>{{ stat.value }}</strong><small>{{ stat.detail }}</small>
      </AppCard>
    </section>

    <div class="workspace-toolbar goals-toolbar">
      <nav class="dashboard-pill-nav" aria-label="Goal views">
        <button
          v-for="view in views"
          :key="view"
          type="button"
          class="dashboard-pill"
          :class="{ 'dashboard-pill--active': activeView === view }"
          :aria-pressed="activeView === view"
          @click="activeView = view"
        >
          {{ view }}
        </button>
      </nav>
      <q-select
        v-model="categoryFilter"
        dense
        outlined
        emit-value
        map-options
        :options="categoryOptions"
        label="Category"
        class="goals-filter"
      />
    </div>

    <AppCard class="workspace-panel goals-panel" padding="small" radius="lg">
      <div v-if="loading" class="workspace-scroll hub-grid goals-pad" aria-busy="true">
        <AppSkeleton v-for="n in 4" :key="n" variant="card" height="150px" />
      </div>

      <div v-else-if="visibleGoals.length" class="workspace-scroll goals-body" :class="{ 'goals-body--grid': activeView !== 'Timeline' }">
        <!-- Timeline view: grouped by target date -->
        <template v-if="activeView === 'Timeline'">
          <button
            v-for="goal in visibleGoals"
            :key="goal.id"
            type="button"
            class="goals-timeline-row hub-enter"
            @click="openGoal(goal)"
          >
            <span class="goals-timeline-row__date">{{ goal.targetDate }}</span>
            <span class="goals-timeline-row__dot" :data-status="goal.status" aria-hidden="true" />
            <span class="goals-timeline-row__body">
              <strong>{{ goal.title }}</strong>
              <small>{{ goal.category }} · {{ goal.progress }}%</small>
            </span>
            <AppBadge :variant="statusVariant(goal.status)" size="compact">{{ goal.status }}</AppBadge>
          </button>
        </template>
        <!-- Overview / Completed: progress cards -->
        <template v-else>
          <button
            v-for="goal in visibleGoals"
            :key="goal.id"
            type="button"
            class="hub-card hub-enter goal-card"
            @click="openGoal(goal)"
          >
            <span class="hub-card__top">
              <AppBadge variant="neutral" size="compact">{{ goal.category }}</AppBadge>
              <AppBadge :variant="statusVariant(goal.status)" size="compact">{{ goal.status }}</AppBadge>
            </span>
            <span class="hub-card__title">{{ goal.title }}</span>
            <p class="goal-card__desc">{{ goal.description }}</p>
            <AppProgress :value="goal.progress" :label="`${goal.title} progress`" />
            <span class="hub-card__meta">
              <span><q-icon name="flag" /> {{ goal.targetDate }}</span>
              <span><q-icon name="checklist" /> {{ doneCount(goal) }}/{{ goal.milestones.length }} milestones</span>
            </span>
          </button>
        </template>
      </div>

      <div v-else class="workspace-empty">
        <AppEmptyState
          icon="flag"
          title="No goals here yet"
          description="Create a goal or switch views to see more."
        />
      </div>
    </AppCard>

    <AppDetailPanel
      v-model="detailOpen"
      eyebrow="Goal"
      :title="mode === 'view' ? (selected?.title ?? 'Goal') : editingId ? 'Edit goal' : 'New goal'"
      :description="mode === 'view' ? (selected?.description ?? '') : 'Define a long-term ambition.'"
    >
      <div v-if="mode === 'view' && selected" class="goal-detail">
        <dl class="workspace-detail-stack">
          <div class="workspace-detail-row"><dt>Category</dt><dd>{{ selected.category }}</dd></div>
          <div class="workspace-detail-row"><dt>Status</dt><dd><AppBadge :variant="statusVariant(selected.status)">{{ selected.status }}</AppBadge></dd></div>
          <div class="workspace-detail-row"><dt>Priority</dt><dd>{{ selected.priority }}</dd></div>
          <div class="workspace-detail-row"><dt>Target</dt><dd>{{ selected.targetDate }}</dd></div>
          <div class="workspace-detail-row"><dt>Progress</dt><dd><AppProgress :value="selected.progress" show-percentage label="Goal progress" /></dd></div>
          <div v-if="selected.relatedProject" class="workspace-detail-row"><dt>Project</dt><dd>{{ selected.relatedProject }}</dd></div>
          <div v-if="selected.motivation" class="workspace-detail-row"><dt>Why</dt><dd>{{ selected.motivation }}</dd></div>
        </dl>
        <h3 class="goal-detail__heading">Milestones</h3>
        <ul class="goal-milestones">
          <li v-for="m in selected.milestones" :key="m.id">
            <q-checkbox
              :model-value="m.done"
              :aria-label="`Toggle ${m.title}`"
              @update:model-value="m.done = !m.done"
            />
            <span :class="{ 'goal-milestone--done': m.done }">{{ m.title }}</span>
            <small>{{ m.targetDate }}</small>
          </li>
          <li v-if="!selected.milestones.length" class="goal-milestones__empty">No milestones yet.</li>
        </ul>
      </div>
      <form v-else id="goal-form" @submit.prevent="saveGoal">
        <label class="workspace-field"><span class="workspace-field__label">Title</span><q-input v-model="draft.title" outlined autofocus /></label>
        <label class="workspace-field"><span class="workspace-field__label">Description</span><q-input v-model="draft.description" outlined type="textarea" autogrow /></label>
        <label class="workspace-field"><span class="workspace-field__label">Category</span><q-select v-model="draft.category" outlined :options="goalCategories" /></label>
        <label class="workspace-field"><span class="workspace-field__label">Status</span><q-select v-model="draft.status" outlined :options="goalStatuses" /></label>
        <label class="workspace-field"><span class="workspace-field__label">Target date</span><q-input v-model="draft.targetDate" outlined /></label>
        <label class="workspace-field"><span class="workspace-field__label">Progress ({{ draft.progress }}%)</span><q-slider v-model="draft.progress" :min="0" :max="100" label /></label>
        <label class="workspace-field"><span class="workspace-field__label">Motivation</span><q-input v-model="draft.motivation" outlined /></label>
      </form>
      <template #actions>
        <template v-if="mode === 'view' && selected">
          <AppButton variant="ghost" icon-left="delete" @click="deleteGoal(selected)">Delete</AppButton>
          <AppButton icon-left="edit" @click="startEdit(selected)">Edit</AppButton>
        </template>
        <AppButton v-else type="submit" form="goal-form" :disabled="!draft.title.trim()">{{
          editingId ? 'Save changes' : 'Create goal'
        }}</AppButton>
      </template>
    </AppDetailPanel>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppDetailPanel from '@/components/ui/AppDetailPanel.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import AppProgress from '@/components/ui/AppProgress.vue';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader.vue';
import { useMockLoad } from '@/composables/useMockLoad';
import { goalCategories, goalStatuses, goals as goalsMock } from '@/data/goals.mock';
import type { Goal, GoalCategory, GoalStatus } from '@/data/goals.mock';

type GoalView = 'Overview' | 'Timeline' | 'Completed';

const $q = useQuasar();
const { loading } = useMockLoad();
const views: GoalView[] = ['Overview', 'Timeline', 'Completed'];
const activeView = ref<GoalView>('Overview');
const goals = ref<Goal[]>(goalsMock.map((g) => ({ ...g, milestones: g.milestones.map((m) => ({ ...m })) })));
const categoryFilter = ref<GoalCategory | 'All'>('All');
const detailOpen = ref(false);
const mode = ref<'view' | 'form'>('view');
const editingId = ref<number | null>(null);
const selected = ref<Goal | null>(null);

const categoryOptions = ['All', ...goalCategories];

const draft = reactive<{
  title: string;
  description: string;
  category: GoalCategory;
  status: GoalStatus;
  targetDate: string;
  progress: number;
  motivation: string;
}>({
  title: '',
  description: '',
  category: 'Career',
  status: 'Active',
  targetDate: '',
  progress: 0,
  motivation: '',
});

const visibleGoals = computed(() =>
  goals.value.filter(
    (g) =>
      (categoryFilter.value === 'All' || g.category === categoryFilter.value) &&
      (activeView.value === 'Completed' ? g.status === 'Completed' : activeView.value === 'Overview' ? g.status !== 'Completed' : true),
  ),
);

const stats = computed(() => [
  { label: 'Active goals', value: goals.value.filter((g) => g.status === 'Active').length, detail: 'In motion' },
  { label: 'Completed', value: goals.value.filter((g) => g.status === 'Completed').length, detail: 'Achieved' },
  { label: 'Due soon', value: goals.value.filter((g) => /2026/.test(g.targetDate) && g.status !== 'Completed').length, detail: 'This year' },
  { label: 'Overall progress', value: `${overall.value}%`, detail: 'Across active' },
]);
const overall = computed(() => {
  const active = goals.value.filter((g) => g.status !== 'Completed');
  return active.length ? Math.round(active.reduce((s, g) => s + g.progress, 0) / active.length) : 0;
});

function doneCount(goal: Goal) {
  return goal.milestones.filter((m) => m.done).length;
}
function statusVariant(status: GoalStatus): 'neutral' | 'mint' | 'teal' | 'dark' {
  if (status === 'Completed') return 'mint';
  if (status === 'Active') return 'teal';
  if (status === 'Paused') return 'dark';
  return 'neutral';
}
function openGoal(goal: Goal) {
  selected.value = goal;
  mode.value = 'view';
  detailOpen.value = true;
}
function openCreate() {
  selected.value = null;
  editingId.value = null;
  Object.assign(draft, { title: '', description: '', category: 'Career', status: 'Active', targetDate: '', progress: 0, motivation: '' });
  mode.value = 'form';
  detailOpen.value = true;
}
function startEdit(goal: Goal) {
  selected.value = goal;
  editingId.value = goal.id;
  Object.assign(draft, {
    title: goal.title,
    description: goal.description,
    category: goal.category,
    status: goal.status,
    targetDate: goal.targetDate,
    progress: goal.progress,
    motivation: goal.motivation,
  });
  mode.value = 'form';
  detailOpen.value = true;
}
function deleteGoal(goal: Goal) {
  goals.value = goals.value.filter((g) => g.id !== goal.id);
  detailOpen.value = false;
  $q.notify({ type: 'positive', message: 'Goal deleted (mock — not saved yet)', timeout: 1600 });
}
function saveGoal() {
  if (!draft.title.trim()) return;
  if (editingId.value !== null) {
    const goal = goals.value.find((g) => g.id === editingId.value);
    if (goal) {
      goal.title = draft.title.trim();
      goal.description = draft.description.trim();
      goal.category = draft.category;
      goal.status = draft.progress >= 100 ? 'Completed' : draft.status;
      goal.targetDate = draft.targetDate.trim() || 'No date';
      goal.progress = draft.progress;
      goal.motivation = draft.motivation.trim();
    }
    $q.notify({ type: 'positive', message: 'Goal updated (mock — not saved yet)', timeout: 1600 });
  } else {
    goals.value.unshift({
      id: Date.now(),
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category,
      targetDate: draft.targetDate.trim() || 'No date',
      progress: draft.progress,
      status: draft.progress >= 100 ? 'Completed' : draft.status,
      priority: 'Medium',
      motivation: draft.motivation.trim(),
      relatedProject: '',
      milestones: [],
    });
    $q.notify({ type: 'positive', message: 'Goal created (mock — not saved yet)', timeout: 1600 });
  }
  detailOpen.value = false;
}
</script>

<style scoped lang="scss">
.goals-toolbar {
  justify-content: space-between;
}
.goals-filter {
  width: 160px;
}
.goals-panel {
  display: flex;
  flex-direction: column;
}
.goals-pad {
  padding: var(--space-2);
}
.goals-body {
  padding: var(--space-2);
}
.goals-body--grid {
  display: grid;
  align-content: start;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-2);
}
.goal-card {
  cursor: pointer;
}
.goal-card__desc {
  overflow: hidden;
  display: -webkit-box;
  font-size: 0.78rem;
  line-height: 1.35;
  opacity: 0.8;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.goals-timeline-row {
  display: grid;
  grid-template-columns: 92px 14px minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  color: var(--color-text);
  text-align: left;
  border-left: 2px solid color-mix(in srgb, var(--color-text) 12%, transparent);
}
.goals-timeline-row:hover {
  background: color-mix(in srgb, var(--color-text) 5%, transparent);
}
.goals-timeline-row__date {
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.72rem;
}
.goals-timeline-row__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-primary);
}
.goals-timeline-row__dot[data-status='Completed'] {
  background: var(--brand-mint);
}
.goals-timeline-row__dot[data-status='Paused'] {
  background: var(--color-text-muted);
}
.goals-timeline-row__body {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.goals-timeline-row__body strong {
  overflow: hidden;
  font-size: 0.9rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.goals-timeline-row__body small {
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.7rem;
}
.goal-detail__heading {
  margin: var(--space-3) 0 var(--space-2);
  font-family: var(--font-heading);
  font-size: 1rem;
}
.goal-milestones {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  list-style: none;
}
.goal-milestones li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.85rem;
}
.goal-milestones li small {
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.7rem;
}
.goal-milestone--done {
  opacity: 0.55;
  text-decoration: line-through;
}
.goal-milestones__empty {
  color: var(--color-text-muted);
  font-style: italic;
}
@media (max-width: 600px) {
  .goals-filter {
    flex: 1;
    width: auto;
  }
}
</style>
