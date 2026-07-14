<template>
  <main class="dashboard-content-page timeline-page">
    <DashboardPageHeader
      eyebrow="Life history"
      title="Personal Timeline"
      description="Keep a private record of meaningful progress, achievements, and important moments."
    >
      <template #action>
        <AppButton variant="dark" icon-left="add" @click="openCreate">Add moment</AppButton>
      </template>
    </DashboardPageHeader>

    <section class="hub-stats" aria-label="Timeline overview">
      <AppCard v-for="stat in stats" :key="stat.label" class="hub-stat" padding="small">
        <span>{{ stat.label }}</span><strong>{{ stat.value }}</strong><small>{{ stat.detail }}</small>
      </AppCard>
    </section>

    <div class="workspace-toolbar timeline-toolbar">
      <nav class="dashboard-pill-nav" aria-label="Timeline views">
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
      <div class="timeline-toolbar__filters">
        <q-select v-model="yearFilter" dense outlined emit-value map-options :options="yearOptions" label="Year" class="timeline-filter" />
        <q-select v-model="categoryFilter" dense outlined emit-value map-options :options="categoryOptions" label="Category" class="timeline-filter" />
        <q-select v-model="importanceFilter" dense outlined emit-value map-options :options="importanceOptions" label="Importance" class="timeline-filter" />
      </div>
    </div>

    <AppCard class="workspace-panel timeline-panel" padding="small" radius="lg">
      <div v-if="loading" class="workspace-scroll timeline-pad" aria-busy="true">
        <AppSkeleton v-for="n in 4" :key="n" variant="text" :lines="2" />
      </div>

      <div v-else-if="!visibleEntries.length" class="workspace-empty">
        <AppEmptyState icon="history" title="No moments here" description="Add a moment or adjust filters." />
      </div>

      <!-- Timeline view: grouped by year -->
      <div v-else-if="activeView === 'Timeline'" class="workspace-scroll timeline-pad">
        <section v-for="group in grouped" :key="group.year" class="timeline-year">
          <h2 class="timeline-year__label">{{ group.year }}</h2>
          <button
            v-for="entry in group.entries"
            :key="entry.id"
            type="button"
            class="timeline-item hub-enter"
            @click="openEntry(entry)"
          >
            <span class="timeline-item__rail" aria-hidden="true">
              <span class="timeline-item__dot" :data-importance="entry.importance" />
            </span>
            <span class="timeline-item__body">
              <span class="timeline-item__head">
                <strong>{{ entry.title }}</strong>
                <AppBadge variant="neutral" size="compact">{{ entry.category }}</AppBadge>
              </span>
              <small>{{ entry.month }} {{ entry.year }}</small>
              <p>{{ entry.description }}</p>
            </span>
          </button>
        </section>
      </div>

      <!-- Grid view -->
      <div v-else-if="activeView === 'Grid'" class="workspace-scroll hub-grid timeline-pad">
        <button v-for="entry in visibleEntries" :key="entry.id" type="button" class="hub-card hub-enter timeline-grid-card" @click="openEntry(entry)">
          <span class="hub-card__top">
            <AppBadge variant="neutral" size="compact">{{ entry.category }}</AppBadge>
            <small class="timeline-grid-card__date">{{ entry.month }} {{ entry.year }}</small>
          </span>
          <span class="hub-card__title">{{ entry.title }}</span>
          <p class="timeline-grid-card__desc">{{ entry.description }}</p>
        </button>
      </div>

      <!-- Highlights: high-importance only -->
      <div v-else class="workspace-scroll hub-grid timeline-pad">
        <AppCard v-for="entry in highlights" :key="entry.id" class="hub-card hub-enter" padding="small" @click="openEntry(entry)">
          <span class="hub-card__top">
            <q-icon name="star" class="timeline-highlight__star" />
            <small class="timeline-grid-card__date">{{ entry.month }} {{ entry.year }}</small>
          </span>
          <span class="hub-card__title">{{ entry.title }}</span>
          <p class="timeline-grid-card__desc">{{ entry.description }}</p>
        </AppCard>
      </div>
    </AppCard>

    <AppDetailPanel
      v-model="detailOpen"
      eyebrow="Moment"
      :title="mode === 'view' ? (selected?.title ?? 'Moment') : editingId ? 'Edit moment' : 'New moment'"
      :description="mode === 'view' ? `${selected?.month ?? ''} ${selected?.year ?? ''}`.trim() : 'Record something meaningful.'"
    >
      <div v-if="mode === 'view' && selected" class="timeline-detail">
        <dl class="workspace-detail-stack">
          <div class="workspace-detail-row"><dt>Category</dt><dd>{{ selected.category }}</dd></div>
          <div class="workspace-detail-row"><dt>Date</dt><dd>{{ selected.month }} {{ selected.year }}</dd></div>
          <div class="workspace-detail-row"><dt>Importance</dt><dd>{{ selected.importance }}</dd></div>
          <div v-if="selected.relatedProject" class="workspace-detail-row"><dt>Project</dt><dd>{{ selected.relatedProject }}</dd></div>
          <div v-if="selected.relatedGoal" class="workspace-detail-row"><dt>Goal</dt><dd>{{ selected.relatedGoal }}</dd></div>
        </dl>
        <p class="timeline-detail__desc">{{ selected.description }}</p>
        <div v-if="selected.tags.length" class="timeline-detail__tags">
          <AppBadge v-for="tag in selected.tags" :key="tag" variant="neutral" size="compact">#{{ tag }}</AppBadge>
        </div>
      </div>
      <form v-else id="moment-form" @submit.prevent="saveMoment">
        <label class="workspace-field"><span class="workspace-field__label">Title</span><q-input v-model="draft.title" outlined autofocus /></label>
        <label class="workspace-field"><span class="workspace-field__label">Date</span><q-input v-model="draft.date" outlined type="date" /></label>
        <label class="workspace-field"><span class="workspace-field__label">Category</span><q-select v-model="draft.category" outlined :options="timelineCategories" /></label>
        <label class="workspace-field"><span class="workspace-field__label">Importance</span><q-select v-model="draft.importance" outlined :options="importanceLevels" /></label>
        <label class="workspace-field"><span class="workspace-field__label">Description</span><q-input v-model="draft.description" outlined type="textarea" autogrow /></label>
        <label class="workspace-field"><span class="workspace-field__label">Related project</span><q-input v-model="draft.relatedProject" outlined /></label>
        <label class="workspace-field"><span class="workspace-field__label">Related goal</span><q-input v-model="draft.relatedGoal" outlined /></label>
        <label class="workspace-field"><span class="workspace-field__label">Tags</span><q-input v-model="draft.tags" outlined hint="Separate tags with commas" /></label>
      </form>
      <template #actions>
        <template v-if="mode === 'view' && selected">
          <AppButton variant="ghost" icon-left="delete" @click="deleteMoment(selected)">Delete</AppButton>
          <AppButton icon-left="edit" @click="openEdit(selected)">Edit</AppButton>
        </template>
        <AppButton v-else type="submit" form="moment-form" :disabled="!validDraft">{{ editingId ? 'Save changes' : 'Add moment' }}</AppButton>
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
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader.vue';
import { useMockLoad } from '@/composables/useMockLoad';
import { isTimelineEntry, timelineCategories, timelineEntries } from '@/data/timeline.mock';
import type { Importance, TimelineCategory, TimelineEntry } from '@/data/timeline.mock';
import { useAuthStore } from '@/stores/auth.store';

type TimelineView = 'Timeline' | 'Grid' | 'Highlights';

const $q = useQuasar();
const auth = useAuthStore();
const { loading } = useMockLoad();
const views: TimelineView[] = ['Timeline', 'Grid', 'Highlights'];
const importanceLevels: Importance[] = ['Low', 'Medium', 'High'];
const activeView = ref<TimelineView>('Timeline');
const storageKey = `personal-dashboard-timeline-v1:${auth.user?.id ?? 'local'}`;
function loadEntries() {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed)
      ? parsed.filter(isTimelineEntry)
      : timelineEntries.map((entry) => ({ ...entry, tags: [...entry.tags] }));
  } catch {
    return timelineEntries.map((entry) => ({ ...entry, tags: [...entry.tags] }));
  }
}
const entries = ref<TimelineEntry[]>(loadEntries());
const yearFilter = ref<number | 'All'>('All');
const categoryFilter = ref<TimelineCategory | 'All'>('All');
const importanceFilter = ref<Importance | 'All'>('All');
const detailOpen = ref(false);
const mode = ref<'view' | 'form'>('view');
const editingId = ref<number | null>(null);
const selected = ref<TimelineEntry | null>(null);

const yearOptions = computed(() => ['All', ...Array.from(new Set(entries.value.map((e) => e.year))).sort((a, b) => b - a)]);
const categoryOptions = ['All', ...timelineCategories];
const importanceOptions = ['All', ...importanceLevels];

const draft = reactive<{
  title: string;
  date: string;
  category: TimelineCategory;
  importance: Importance;
  description: string;
  relatedProject: string;
  relatedGoal: string;
  tags: string;
}>({
  title: '',
  date: '',
  category: 'Achievement',
  importance: 'Medium',
  description: '',
  relatedProject: '',
  relatedGoal: '',
  tags: '',
});
const validDraft = computed(() => Boolean(draft.title.trim() && /^\d{4}-\d{2}-\d{2}$/.test(draft.date)));

const visibleEntries = computed(() =>
  entries.value
    .filter(
      (e) =>
        (yearFilter.value === 'All' || e.year === yearFilter.value) &&
        (categoryFilter.value === 'All' || e.category === categoryFilter.value) &&
        (importanceFilter.value === 'All' || e.importance === importanceFilter.value),
    )
    .sort((a, b) => b.date.localeCompare(a.date)),
);

const grouped = computed(() => {
  const map = new Map<number, TimelineEntry[]>();
  for (const entry of visibleEntries.value) {
    const list = map.get(entry.year) ?? [];
    list.push(entry);
    map.set(entry.year, list);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, list]) => ({ year, entries: list }));
});

const highlights = computed(() => visibleEntries.value.filter((e) => e.importance === 'High'));

const stats = computed(() => [
  { label: 'Total moments', value: entries.value.length, detail: 'Recorded' },
  { label: 'This year', value: entries.value.filter((e) => e.year === new Date().getFullYear()).length, detail: String(new Date().getFullYear()) },
  { label: 'Highlights', value: entries.value.filter((e) => e.importance === 'High').length, detail: 'High importance' },
  { label: 'Categories', value: new Set(entries.value.map((e) => e.category)).size, detail: 'In use' },
]);

function openEntry(entry: TimelineEntry) {
  selected.value = entry;
  mode.value = 'view';
  detailOpen.value = true;
}
function openCreate() {
  selected.value = null;
  editingId.value = null;
  Object.assign(draft, {
    title: '',
    date: new Date().toISOString().slice(0, 10),
    category: 'Achievement',
    importance: 'Medium',
    description: '',
    relatedProject: '',
    relatedGoal: '',
    tags: '',
  });
  mode.value = 'form';
  detailOpen.value = true;
}
function openEdit(entry: TimelineEntry) {
  editingId.value = entry.id;
  Object.assign(draft, {
    title: entry.title,
    date: entry.date,
    category: entry.category,
    importance: entry.importance,
    description: entry.description,
    relatedProject: entry.relatedProject,
    relatedGoal: entry.relatedGoal,
    tags: entry.tags.join(', '),
  });
  mode.value = 'form';
}
function persist(next: TimelineEntry[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(next));
    return true;
  } catch {
    $q.notify({ type: 'negative', message: 'Could not save timeline changes', timeout: 1800 });
    return false;
  }
}
function saveMoment() {
  if (!validDraft.value) return;
  const date = draft.date;
  const year = Number(date.slice(0, 4));
  const month = new Date(`${date}T00:00:00`).toLocaleString('en-US', { month: 'long' });
  const entry: TimelineEntry = {
    id: editingId.value ?? Date.now(),
    title: draft.title.trim(),
    date,
    year,
    month,
    category: draft.category,
    description: draft.description.trim(),
    relatedProject: draft.relatedProject.trim(),
    relatedGoal: draft.relatedGoal.trim(),
    tags: [...new Set(draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean))],
    importance: draft.importance,
  };
  const next = editingId.value === null
    ? [entry, ...entries.value]
    : entries.value.map((item) => (item.id === editingId.value ? entry : item));
  if (!persist(next)) return;
  entries.value = next;
  detailOpen.value = false;
  $q.notify({ type: 'positive', message: editingId.value ? 'Moment updated' : 'Moment added', timeout: 1400 });
}
function deleteMoment(entry: TimelineEntry) {
  if (!window.confirm(`Delete “${entry.title}”?`)) return;
  const next = entries.value.filter((item) => item.id !== entry.id);
  if (!persist(next)) return;
  entries.value = next;
  detailOpen.value = false;
  $q.notify({ message: 'Moment deleted', timeout: 1200 });
}
</script>

<style scoped lang="scss">
.timeline-toolbar {
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.timeline-toolbar__filters {
  display: flex;
  gap: var(--space-2);
}
.timeline-filter {
  width: 130px;
}
.timeline-panel {
  display: flex;
  flex-direction: column;
}
.timeline-pad {
  padding: var(--space-3);
}
.timeline-year + .timeline-year {
  margin-top: var(--space-4);
}
.timeline-year__label {
  margin-bottom: var(--space-2);
  font-family: var(--font-heading);
  font-size: 1.1rem;
  color: var(--color-text-secondary);
}
.timeline-item {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-1) var(--space-1) var(--space-3);
  color: var(--color-text);
  text-align: left;
}
.timeline-item__rail {
  display: flex;
  justify-content: center;
  position: relative;
}
.timeline-item__rail::before {
  content: '';
  position: absolute;
  top: 4px;
  bottom: -12px;
  width: 2px;
  background: color-mix(in srgb, var(--color-text) 12%, transparent);
}
.timeline-item:last-child .timeline-item__rail::before {
  display: none;
}
.timeline-item__dot {
  z-index: 1;
  width: 12px;
  height: 12px;
  margin-top: 3px;
  border-radius: 50%;
  background: var(--color-primary);
}
.timeline-item__dot[data-importance='High'] {
  background: var(--brand-mint);
}
.timeline-item__dot[data-importance='Low'] {
  background: var(--color-text-muted);
}
.timeline-item__body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}
.timeline-item__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.timeline-item__head strong {
  font-size: 0.95rem;
}
.timeline-item__body small {
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.7rem;
}
.timeline-item__body p {
  font-size: 0.82rem;
  line-height: 1.4;
  opacity: 0.85;
}
.timeline-grid-card {
  cursor: pointer;
}
.timeline-grid-card__date {
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.7rem;
}
.timeline-grid-card__desc {
  overflow: hidden;
  display: -webkit-box;
  font-size: 0.8rem;
  line-height: 1.35;
  opacity: 0.85;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
.timeline-highlight__star {
  color: var(--color-warning);
  font-size: 1.2rem;
}
.timeline-detail__desc {
  margin-top: var(--space-3);
  font-size: 0.88rem;
  line-height: 1.5;
}
.timeline-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-3);
}
@media (max-width: 600px) {
  .timeline-toolbar__filters {
    width: 100%;
  }
  .timeline-filter {
    flex: 1;
    width: auto;
  }
}
</style>
