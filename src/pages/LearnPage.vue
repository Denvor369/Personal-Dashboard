<template>
  <main class="dashboard-content-page learn-page">
    <DashboardPageHeader
      eyebrow="Skill building"
      title="Learn"
      description="Document the skills you want to learn, then focus a practice session on one at a time."
    >
      <template #action>
        <AppButton variant="dark" icon-left="add" @click="openCreate">Add skill</AppButton>
      </template>
    </DashboardPageHeader>

    <!-- Hero: ring timer + journey summary -->
    <section class="learn-hero">
      <AppCard ref="timerRef" class="focus-panel" variant="dark" padding="medium" radius="lg">
        <header class="focus-panel__head">
          <div>
            <p class="dashboard-eyebrow">Practice session</p>
            <h2>Focus timer</h2>
          </div>
          <span class="focus-panel__status">{{ running ? 'In progress' : 'Ready' }}</span>
        </header>

        <div class="focus-panel__grid">
          <div class="focus-ring" role="timer" :aria-label="`${formattedTime} remaining`">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle class="focus-ring__track" cx="60" cy="60" r="54" />
              <circle
                class="focus-ring__progress"
                cx="60"
                cy="60"
                r="54"
                :stroke-dashoffset="ringOffset"
              />
            </svg>
            <strong>{{ formattedTime }}</strong>
            <span>remaining</span>
          </div>

          <div class="focus-panel__side">
            <label class="focus-panel__field">
              <span>Focus skill</span>
              <q-select
                dense
                outlined
                :model-value="learn.activeSkillId"
                :options="skillOptions"
                emit-value
                map-options
                :disable="!learn.skills.length"
                @update:model-value="learn.setActive"
              />
            </label>

            <div class="focus-panel__presets" role="group" aria-label="Session length">
              <button
                v-for="preset in presets"
                :key="preset"
                type="button"
                class="focus-preset"
                :class="{ 'focus-preset--active': durationMin === preset }"
                :aria-pressed="durationMin === preset"
                @click="setPreset(preset)"
              >
                {{ preset }}m
              </button>
            </div>

            <div class="focus-panel__controls">
              <AppButton
                variant="secondary"
                :icon-left="running ? 'pause' : 'play_arrow'"
                :disabled="!learn.activeSkillId"
                @click="toggle"
              >
                {{ running ? 'Pause' : 'Start' }}
              </AppButton>
              <AppIconButton
                icon="check"
                label="Log session and reset"
                :disabled="elapsedSeconds === 0"
                @click="finishSession"
              />
              <AppIconButton icon="restart_alt" label="Reset timer" @click="reset" />
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard class="learn-summary" padding="medium" radius="lg">
        <p class="dashboard-eyebrow">Your journey</p>
        <div class="learn-summary__grid">
          <div v-for="stat in stats" :key="stat.label" class="learn-summary__tile">
            <strong>{{ stat.value }}</strong>
            <span>{{ stat.label }}</span>
            <small>{{ stat.detail }}</small>
          </div>
        </div>
      </AppCard>
    </section>

    <div class="workspace-toolbar learn-toolbar">
      <nav class="dashboard-pill-nav" aria-label="Skill categories">
        <button
          v-for="filter in filters"
          :key="filter"
          type="button"
          class="dashboard-pill"
          :class="{ 'dashboard-pill--active': activeFilter === filter }"
          :aria-pressed="activeFilter === filter"
          @click="activeFilter = filter"
        >
          {{ filter }}
        </button>
      </nav>
      <span class="workspace-meta">{{ filteredSkills.length }} skills</span>
    </div>

    <section v-if="filteredSkills.length" class="learn-grid" aria-label="Skills">
      <article
        v-for="skill in filteredSkills"
        :key="skill.id"
        class="skill-card"
        :class="{ 'skill-card--active': skill.id === learn.activeSkillId }"
      >
        <div class="skill-card__top">
          <AppBadge
            :variant="skill.id === learn.activeSkillId ? 'dark' : badgeVariant(skill.category)"
            size="compact"
          >
            {{ skill.category }}
          </AppBadge>
          <span v-if="skill.id === learn.activeSkillId" class="skill-card__focusing">
            <q-icon name="bolt" /> Focusing
          </span>
          <AppIconButton icon="edit" label="Edit skill" size="small" @click="openEdit(skill)" />
        </div>

        <div class="skill-card__body">
          <strong>{{ skill.name }}</strong>
          <p>{{ skill.goal }}</p>
        </div>

        <AppProgress
          :value="skill.progress"
          :variant="skill.progress >= 100 ? 'mint' : 'primary'"
          show-percentage
          :label="`${skill.name} mastery`"
        />

        <div class="skill-card__footer">
          <span class="skill-card__time">
            <q-icon name="timer" /> {{ formatDuration(skill.practiceMinutes) }}
          </span>
          <AppButton size="small" variant="ghost" icon-left="play_arrow" @click="practice(skill)">
            Practice
          </AppButton>
        </div>
      </article>
    </section>
    <AppCard v-else class="learn-empty" padding="small" radius="lg">
      <AppEmptyState
        icon="school"
        title="No skills here yet"
        description="Add a skill you want to learn — guitar, DevOps, a language — and start a focus session."
      >
        <template #action>
          <AppButton icon-left="add" @click="openCreate">Add your first skill</AppButton>
        </template>
      </AppEmptyState>
    </AppCard>

    <AppDetailPanel
      v-model="detailOpen"
      eyebrow="Skill"
      :title="editingId ? draft.name || 'Edit skill' : 'New skill'"
      description="What do you want to learn, and how will you know you've got it?"
    >
      <form id="skill-form" @submit.prevent="save">
        <label class="workspace-field">
          <span class="workspace-field__label">Skill name</span>
          <q-input v-model="draft.name" outlined autofocus placeholder="e.g. Play the guitar" />
        </label>
        <label class="workspace-field">
          <span class="workspace-field__label">Category</span>
          <q-select v-model="draft.category" outlined :options="skillCategories" />
        </label>
        <label class="workspace-field">
          <span class="workspace-field__label">Goal</span>
          <q-input
            v-model="draft.goal"
            outlined
            type="textarea"
            autogrow
            placeholder="What does 'learned' look like?"
          />
        </label>
        <div class="workspace-field">
          <span class="workspace-field__label">Current mastery — {{ draft.progress }}%</span>
          <q-slider v-model="draft.progress" :min="0" :max="100" :step="5" color="primary" />
        </div>
      </form>

      <template #actions>
        <AppButton v-if="editingId" variant="ghost" icon-left="delete" @click="confirmDelete">
          {{ confirmingDelete ? 'Tap again to delete' : 'Delete' }}
        </AppButton>
        <AppButton type="submit" form="skill-form" :disabled="!draft.name.trim()">
          {{ editingId ? 'Save skill' : 'Add skill' }}
        </AppButton>
      </template>
    </AppDetailPanel>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppDetailPanel from '@/components/ui/AppDetailPanel.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import AppIconButton from '@/components/ui/AppIconButton.vue';
import AppProgress from '@/components/ui/AppProgress.vue';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader.vue';
import { skillCategories } from '@/data/learn.mock';
import type { LearnSkill, SkillCategory } from '@/data/learn.mock';
import { formatDuration, useLearnStore } from '@/stores/learn.store';

type BadgeVariant = 'neutral' | 'mint' | 'teal' | 'dark';
type CategoryFilter = 'All' | SkillCategory;

const $q = useQuasar();
const learn = useLearnStore();

// ----- skills list + filtering -----
const activeFilter = ref<CategoryFilter>('All');
const usedCategories = computed(() => [...new Set(learn.skills.map((skill) => skill.category))]);
const filters = computed<CategoryFilter[]>(() => ['All', ...usedCategories.value]);
const filteredSkills = computed(() =>
  activeFilter.value === 'All'
    ? learn.skills
    : learn.skills.filter((skill) => skill.category === activeFilter.value),
);

// Reset a category filter that no longer exists (e.g. its last skill was deleted).
watch(filters, (list) => {
  if (!list.includes(activeFilter.value)) activeFilter.value = 'All';
});

const skillOptions = computed(() =>
  learn.skills.map((skill) => ({ label: skill.name, value: skill.id })),
);

const stats = computed(() => [
  { label: 'Skills tracked', value: learn.skills.length, detail: 'In your library' },
  { label: 'In progress', value: learn.inProgressCount, detail: 'Still learning' },
  { label: 'Mastered', value: learn.masteredCount, detail: 'At 100%' },
  { label: 'Total practice', value: formatDuration(learn.totalMinutes), detail: 'Logged so far' },
]);

function badgeVariant(category: SkillCategory): BadgeVariant {
  switch (category) {
    case 'Music':
    case 'Fitness':
      return 'mint';
    case 'DevOps':
    case 'Design':
      return 'teal';
    case 'Programming':
      return 'dark';
    default:
      return 'neutral';
  }
}

// ----- focus timer -----
const circumference = 2 * Math.PI * 54;
const presets = [15, 25, 45];
const durationMin = ref(25);
const remaining = ref(durationMin.value * 60);
const running = ref(false);
let interval: ReturnType<typeof setInterval> | undefined;

const activeSkill = computed(() => learn.activeSkill);
const totalSeconds = computed(() => durationMin.value * 60);
const elapsedSeconds = computed(() => totalSeconds.value - remaining.value);
const ringOffset = computed(() =>
  totalSeconds.value ? circumference * (1 - remaining.value / totalSeconds.value) : 0,
);
const formattedTime = computed(() => {
  const minutes = Math.floor(remaining.value / 60);
  const seconds = remaining.value % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

function stopTimer() {
  running.value = false;
  if (interval) clearInterval(interval);
  interval = undefined;
}

function finishSession() {
  const minutes = Math.round(elapsedSeconds.value / 60);
  if (minutes > 0 && learn.activeSkillId) {
    learn.logPractice(learn.activeSkillId, minutes);
    $q.notify({
      type: 'positive',
      message: `Logged ${minutes} min to ${activeSkill.value?.name ?? 'skill'}`,
      timeout: 1600,
    });
  }
  stopTimer();
  remaining.value = totalSeconds.value;
}

function toggle() {
  if (!learn.activeSkillId) return;
  if (running.value) {
    stopTimer();
    return;
  }
  if (remaining.value === 0) remaining.value = totalSeconds.value;
  running.value = true;
  interval = setInterval(() => {
    remaining.value -= 1;
    if (remaining.value <= 0) {
      remaining.value = 0;
      finishSession();
    }
  }, 1000);
}

function reset() {
  stopTimer();
  remaining.value = totalSeconds.value;
}

function setPreset(minutes: number) {
  durationMin.value = minutes;
  if (!running.value) remaining.value = minutes * 60;
}

const timerRef = ref<{ $el: HTMLElement } | null>(null);
function practice(skill: LearnSkill) {
  learn.setActive(skill.id);
  reset();
  timerRef.value?.$el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

onBeforeUnmount(stopTimer);

// ----- add / edit skill -----
const detailOpen = ref(false);
const editingId = ref<string | null>(null);
const confirmingDelete = ref(false);
const draft = reactive<{
  name: string;
  category: SkillCategory;
  goal: string;
  progress: number;
}>({ name: '', category: 'Programming', goal: '', progress: 0 });

function openCreate() {
  editingId.value = null;
  confirmingDelete.value = false;
  Object.assign(draft, { name: '', category: 'Programming', goal: '', progress: 0 });
  detailOpen.value = true;
}

function openEdit(skill: LearnSkill) {
  editingId.value = skill.id;
  confirmingDelete.value = false;
  Object.assign(draft, {
    name: skill.name,
    category: skill.category,
    goal: skill.goal,
    progress: skill.progress,
  });
  detailOpen.value = true;
}

function save() {
  if (!draft.name.trim()) return;
  if (editingId.value) {
    learn.updateSkill(editingId.value, { ...draft });
  } else {
    learn.addSkill({ ...draft });
  }
  detailOpen.value = false;
  $q.notify({
    type: 'positive',
    message: editingId.value ? 'Skill updated' : 'Skill added',
    timeout: 1400,
  });
}

function confirmDelete() {
  if (!editingId.value) return;
  if (!confirmingDelete.value) {
    confirmingDelete.value = true;
    return;
  }
  learn.removeSkill(editingId.value);
  detailOpen.value = false;
  $q.notify({ message: 'Skill removed', timeout: 1400 });
}
</script>

<style scoped lang="scss">
/* ----- hero: timer + summary ----- */
.learn-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: var(--space-3);
}

.focus-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}
.focus-panel__head h2 {
  margin: 2px 0 0;
  font-size: clamp(1.125rem, 1.5vw, 1.375rem);
  font-weight: 700;
}
.focus-panel__status {
  padding: 0.25rem 0.6rem;
  border: 1px solid color-mix(in srgb, currentColor 40%, transparent);
  border-radius: var(--radius-pill);
  font-family: var(--font-control);
  font-size: 0.68rem;
  line-height: 1.2;
  text-transform: uppercase;
}

.focus-panel__grid {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(16px, 3vw, 40px);
  margin-top: var(--space-3);
}

.focus-ring {
  position: relative;
  display: grid;
  width: clamp(132px, 13vw, 172px);
  aspect-ratio: 1;
  place-content: center;
  text-align: center;
}
.focus-ring svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.focus-ring circle {
  fill: none;
  stroke-width: 5;
}
.focus-ring__track {
  stroke: color-mix(in srgb, currentColor 22%, transparent);
}
.focus-ring__progress {
  stroke: var(--brand-mint);
  stroke-dasharray: 339.292;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear;
}
.focus-ring strong {
  font-family: var(--font-heading);
  font-size: clamp(1.6rem, 2.4vw, 2.1rem);
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.focus-ring span {
  margin-top: 2px;
  font-family: var(--font-control);
  font-size: 0.64rem;
  letter-spacing: 0.08em;
  opacity: 0.7;
  text-transform: uppercase;
}

.focus-panel__side {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
}
.focus-panel__field span {
  display: block;
  margin-bottom: var(--space-1);
  font-family: var(--font-control);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.8;
}
.focus-panel__field :deep(.q-field__control),
.focus-panel__field :deep(.q-field__native),
.focus-panel__field :deep(.q-field__append) {
  color: inherit;
}
.focus-panel__field :deep(.q-field__control) {
  border-radius: var(--radius-sm);
}
.focus-panel__presets {
  display: flex;
  gap: var(--space-2);
}
.focus-preset {
  flex: 1;
  min-height: 38px;
  border: 1px solid color-mix(in srgb, currentColor 40%, transparent);
  border-radius: var(--radius-pill);
  color: inherit;
  font-family: var(--font-control);
}
.focus-preset--active {
  border-color: var(--brand-mint);
  color: var(--brand-deep);
  background: var(--brand-mint);
  font-weight: 700;
}
.focus-panel__controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.focus-panel__controls :deep(.app-icon-btn) {
  border: 1px solid color-mix(in srgb, currentColor 35%, transparent);
  border-radius: 50%;
  color: inherit;
}

/* summary */
.learn-summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  background: var(--color-surface);
}
.learn-summary__grid {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}
.learn-summary__tile {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
  padding: var(--space-2) var(--space-3);
  border: var(--border-thin);
  border-radius: var(--radius-sm);
  background: var(--color-surface-raised);
}
.learn-summary__tile strong {
  font-family: var(--font-heading);
  font-size: clamp(1.4rem, 2vw, 1.85rem);
  font-weight: 700;
  line-height: 1.05;
}
.learn-summary__tile span {
  font-family: var(--font-control);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.learn-summary__tile small {
  color: var(--color-text-muted);
  font-family: var(--font-body);
  font-size: 0.7rem;
  font-style: italic;
}

/* ----- skills ----- */
.learn-toolbar {
  justify-content: space-between;
  margin-top: var(--space-4);
}
.learn-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: var(--space-3);
}
.skill-card {
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  gap: var(--space-2);
  min-height: 190px;
  padding: var(--space-3);
  border: var(--border-thin);
  border-radius: var(--radius-md);
  color: var(--color-text);
  background: var(--color-surface);
  transition: box-shadow var(--duration-fast) var(--ease-smooth-out);
}
.skill-card:hover {
  box-shadow: var(--shadow-md);
}
.skill-card--active {
  border-color: transparent;
  color: var(--brand-deep);
  background: var(--brand-mint);
}
.skill-card__top {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.skill-card__top :deep(.app-icon-btn) {
  margin-left: auto;
  color: inherit;
}
.skill-card__focusing {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-family: var(--font-control);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
}
.skill-card__body > strong {
  font-family: var(--font-heading);
  font-size: 1.15rem;
  font-weight: 700;
}
.skill-card__body p {
  display: -webkit-box;
  margin-top: 2px;
  overflow: hidden;
  font-size: 0.78rem;
  font-style: italic;
  line-height: 1.35;
  opacity: 0.78;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.skill-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.skill-card__time {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, currentColor 10%, transparent);
  font-family: var(--font-control);
  font-size: 0.72rem;
}
.skill-card--active :deep(.app-btn--ghost) {
  border-color: color-mix(in srgb, var(--brand-deep) 45%, transparent);
  color: var(--brand-deep);
}
.learn-empty {
  background: var(--color-surface);
}

/* ----- responsive ----- */
@media (max-width: 1000px) {
  .learn-hero {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .focus-panel__grid {
    grid-template-columns: 1fr;
    justify-items: center;
  }
  .focus-panel__side {
    width: 100%;
  }
  .learn-summary__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
