<template>
  <main class="dashboard-content-page projects-page">
    <DashboardPageHeader
      eyebrow="Active work"
      title="Projects"
      description="Track progress and open the project that needs attention next."
    >
      <template #action
        ><AppButton variant="dark" icon-left="add" @click="openCreate"
          >New project</AppButton
        ></template
      >
    </DashboardPageHeader>

    <section class="project-stats" aria-label="Project overview">
      <AppCard v-for="stat in projectStats" :key="stat.label" class="project-stat" padding="small">
        <span>{{ stat.label }}</span
        ><strong>{{ stat.value }}</strong
        ><small>{{ stat.detail }}</small>
      </AppCard>
    </section>

    <div class="workspace-toolbar projects-toolbar">
      <nav class="dashboard-pill-nav" aria-label="Project filters">
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
      <span class="workspace-meta">{{ filteredProjects.length }} projects</span>
    </div>

    <AppCard class="workspace-panel project-panel" padding="small" radius="lg">
      <div v-if="filteredProjects.length" class="workspace-scroll project-list">
        <button
          v-for="project in filteredProjects"
          :key="project.id"
          type="button"
          class="project-row"
          :class="`project-row--${statusKey(project.status)}`"
          @click="openProject(project)"
        >
          <span class="project-status"
            ><span class="project-status__dot" aria-hidden="true"></span>{{ project.status }}</span
          >
          <span class="project-row__main"
            ><strong>{{ project.name }}</strong>
            <p>{{ project.description }}</p></span
          >
          <span class="project-row__progress"
            ><AppProgress :value="project.progress" :label="`${project.name} progress`" /><strong
              >{{ project.progress }}%</strong
            ></span
          >
          <span class="project-row__due"><q-icon name="event" /> {{ project.deadline }}</span>
          <q-icon class="project-row__go" name="arrow_forward" />
        </button>
      </div>
      <div v-else class="workspace-empty">
        <AppEmptyState
          icon="work_off"
          title="No completed projects yet"
          description="Completed work will stay available here."
        />
      </div>
    </AppCard>

    <AppDetailPanel
      v-model="detailOpen"
      eyebrow="Project"
      :title="mode === 'view' ? (selectedProject?.name ?? 'Project') : editingId ? 'Edit project' : 'New project'"
      :description="
        mode === 'view'
          ? (selectedProject?.description ?? '')
          : 'Define a useful outcome and the next milestone.'
      "
    >
      <dl v-if="mode === 'view' && selectedProject" class="workspace-detail-stack">
        <div class="workspace-detail-row">
          <dt>Status</dt>
          <dd>
            <AppBadge :variant="statusVariant(selectedProject.status)">{{
              selectedProject.status
            }}</AppBadge>
          </dd>
        </div>
        <div class="workspace-detail-row">
          <dt>Deadline</dt>
          <dd>{{ selectedProject.deadline }}</dd>
        </div>
        <div class="workspace-detail-row">
          <dt>Progress</dt>
          <dd>
            <AppProgress
              :value="selectedProject.progress"
              show-percentage
              label="Project progress"
            />
          </dd>
        </div>
      </dl>
      <form v-else id="project-form" @submit.prevent="saveProject">
        <label class="workspace-field"
          ><span class="workspace-field__label">Project name</span
          ><q-input v-model="draft.name" outlined autofocus
        /></label>
        <label class="workspace-field"
          ><span class="workspace-field__label">Short description</span
          ><q-input v-model="draft.description" outlined type="textarea" autogrow
        /></label>
        <label class="workspace-field"
          ><span class="workspace-field__label">Status</span
          ><q-select v-model="draft.status" :options="statusOptions" outlined
        /></label>
        <label class="workspace-field"
          ><span class="workspace-field__label">Progress ({{ draft.progress }}%)</span
          ><q-slider v-model="draft.progress" :min="0" :max="100" :step="1" label
        /></label>
        <label class="workspace-field"
          ><span class="workspace-field__label">Deadline</span
          ><q-input v-model="draft.deadline" outlined type="date"
        /></label>
      </form>
      <template #actions>
        <template v-if="mode === 'view'">
          <AppButton variant="ghost" icon-left="delete" @click="deleteProject">Delete</AppButton>
          <AppButton icon-left="edit" @click="startEdit">Edit</AppButton>
        </template>
        <AppButton v-else type="submit" form="project-form" :disabled="!draft.name.trim()">{{
          editingId ? 'Save changes' : 'Create project'
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
import DashboardPageHeader from '@/components/layout/DashboardPageHeader.vue';
import { workspaceProjects } from '@/data/workspace.mock';
import type { WorkspaceProject } from '@/data/workspace.mock';

type ProjectFilter = 'Active' | 'Completed';
const $q = useQuasar();
const filters: ProjectFilter[] = ['Active', 'Completed'];
const projects = ref(workspaceProjects.map((project) => ({ ...project })));
const activeFilter = ref<ProjectFilter>('Active');
const detailOpen = ref(false);
const mode = ref<'view' | 'form'>('view');
const editingId = ref<number | null>(null);
const selectedProject = ref<WorkspaceProject | null>(null);
const statusOptions: WorkspaceProject['status'][] = [
  'In progress',
  'Planning',
  'At risk',
  'Completed',
];
const draft = reactive<{
  name: string;
  description: string;
  deadline: string;
  status: WorkspaceProject['status'];
  progress: number;
}>({
  name: '',
  description: '',
  deadline: '',
  status: 'Planning',
  progress: 0,
});
const activeProjects = computed(() =>
  projects.value.filter((project) => project.status !== 'Completed'),
);
const filteredProjects = computed(() =>
  projects.value.filter((project) =>
    activeFilter.value === 'Completed'
      ? project.status === 'Completed'
      : project.status !== 'Completed',
  ),
);
const overallProgress = computed(() =>
  Math.round(
    activeProjects.value.reduce((sum, project) => sum + project.progress, 0) /
      Math.max(1, activeProjects.value.length),
  ),
);
const projectStats = computed(() => [
  { label: 'Active projects', value: activeProjects.value.length, detail: '2 moving today' },
  {
    label: 'Completed',
    value: projects.value.filter((project) => project.status === 'Completed').length,
    detail: 'This quarter',
  },
  { label: 'Due soon', value: 2, detail: 'Next 7 days' },
  { label: 'Overall progress', value: `${overallProgress.value}%`, detail: 'Across active work' },
]);

function statusVariant(status: WorkspaceProject['status']) {
  return status === 'Completed' ? 'mint' : status === 'At risk' ? 'dark' : 'teal';
}
function statusKey(status: WorkspaceProject['status']) {
  return status.toLowerCase().replace(/\s+/g, '-');
}
function openProject(project: WorkspaceProject) {
  selectedProject.value = project;
  mode.value = 'view';
  detailOpen.value = true;
}
function openCreate() {
  selectedProject.value = null;
  editingId.value = null;
  Object.assign(draft, { name: '', description: '', deadline: '', status: 'Planning', progress: 0 });
  mode.value = 'form';
  detailOpen.value = true;
}
function startEdit() {
  const project = selectedProject.value;
  if (!project) return;
  editingId.value = project.id;
  Object.assign(draft, {
    name: project.name,
    description: project.description,
    deadline: project.deadline,
    status: project.status,
    progress: project.progress,
  });
  mode.value = 'form';
}
function saveProject() {
  if (!draft.name.trim()) return;
  const values = {
    name: draft.name.trim(),
    description: draft.description.trim() || 'A new project ready to define.',
    progress: draft.progress,
    deadline: draft.deadline || 'No date',
    status: draft.status,
  };
  if (editingId.value) {
    const existing = projects.value.find((project) => project.id === editingId.value);
    if (existing) Object.assign(existing, values);
    $q.notify({ type: 'positive', message: 'Project updated locally', timeout: 1400 });
  } else {
    projects.value.unshift({ id: Date.now(), tone: 'cream', ...values });
    $q.notify({ type: 'positive', message: 'Project created locally', timeout: 1400 });
  }
  detailOpen.value = false;
}
function deleteProject() {
  const project = selectedProject.value;
  if (!project) return;
  $q.dialog({
    title: 'Delete project',
    message: `Remove "${project.name}"? This can't be undone.`,
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    projects.value = projects.value.filter((item) => item.id !== project.id);
    detailOpen.value = false;
    $q.notify({ type: 'info', message: 'Project deleted locally', timeout: 1400 });
  });
}
</script>

<style scoped lang="scss">
.project-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-2);
}
.project-stat {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  min-height: 72px;
}
.project-stat span,
.project-stat small {
  font-family: var(--font-control);
}
.project-stat span {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.project-stat strong {
  grid-row: 1 / 3;
  grid-column: 2;
  font-family: var(--font-heading);
  font-size: 1.85rem;
  font-weight: 700;
}
.project-stat small {
  color: var(--color-text-muted);
  font-family: var(--font-body);
  font-size: 0.7rem;
  font-style: italic;
}
.projects-toolbar {
  justify-content: space-between;
}
.project-panel {
  display: flex;
  flex-direction: column;
}
.project-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 2px;
}
.project-row {
  // Compact list row: status | name+desc | progress | due | go.
  // Color carries status via --accent (stripe, dot, progress fill); at-risk gets a warning tint.
  --accent: var(--brand-teal);
  display: grid;
  grid-template-columns: 128px minmax(0, 1fr) minmax(150px, 230px) 84px 18px;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: var(--border-thin);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius-md);
  color: var(--color-text);
  background: color-mix(in srgb, var(--color-text) 5%, transparent);
  text-align: left;
  transition: box-shadow var(--transition-base) var(--ease);
}
.project-row--in-progress {
  --accent: var(--brand-mint);
}
.project-row--planning {
  --accent: color-mix(in srgb, var(--color-text) 45%, transparent);
}
.project-row--completed {
  --accent: var(--brand-teal);
}
// At risk earns the emphasis the page subtitle promises ("needs attention next").
.project-row--at-risk {
  --accent: var(--color-warning);
  background: color-mix(in srgb, var(--color-warning) 12%, transparent);
}
.project-row:hover {
  box-shadow: var(--shadow-md);
}
.project-row :deep(.app-progress__fill) {
  background: var(--accent) !important;
}
.project-status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-control);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}
.project-status__dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: var(--radius-pill);
  background: var(--accent);
}
.project-row__main {
  min-width: 0;
}
.project-row__main > strong {
  display: block;
  font-family: var(--font-heading);
  font-size: 1.05rem;
  font-weight: 700;
}
.project-row__main p {
  overflow: hidden;
  font-size: 0.78rem;
  font-style: italic;
  line-height: 1.35;
  opacity: 0.78;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.project-row__progress {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.project-row__progress :deep(.app-progress) {
  flex: 1 1 auto;
  min-width: 0;
}
.project-row__progress > strong {
  min-width: 3ch;
  font-family: var(--font-heading);
  font-size: 0.9rem;
  font-weight: 700;
  text-align: right;
}
.project-row__due {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-control);
  font-size: 0.72rem;
  white-space: nowrap;
}
.project-row__go {
  font-size: 1.1rem;
  opacity: 0.7;
}
@media (max-width: 900px) {
  .project-stat small {
    display: none;
  }
  .project-row {
    grid-template-columns: 110px minmax(0, 1fr) 64px 16px;
  }
  .project-row__progress {
    display: none;
  }
}
@media (max-width: 600px) {
  .project-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .project-row {
    grid-template-columns: 1fr auto;
    row-gap: var(--space-1);
  }
  .project-status {
    grid-column: 1;
  }
  .project-row__due {
    grid-column: 2;
    grid-row: 1;
    justify-self: end;
  }
  .project-row__main {
    grid-column: 1 / -1;
  }
  .project-row__go {
    display: none;
  }
}
</style>
