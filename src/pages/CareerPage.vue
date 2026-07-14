<template>
  <main class="dashboard-content-page career-page">
    <DashboardPageHeader
      eyebrow="Career development"
      title="Career Hub"
      description="Track applications, interviews, skills, and progress toward my next role."
    >
      <template #action>
        <AppButton variant="dark" icon-left="add" @click="openCreate">Add application</AppButton>
      </template>
    </DashboardPageHeader>

    <section class="hub-stats" aria-label="Career overview">
      <AppCard v-for="stat in stats" :key="stat.label" class="hub-stat" padding="small">
        <span>{{ stat.label }}</span><strong>{{ stat.value }}</strong><small>{{ stat.detail }}</small>
      </AppCard>
    </section>

    <div class="workspace-toolbar career-toolbar">
      <nav class="dashboard-pill-nav" aria-label="Career sections">
        <button
          v-for="tab in tabs"
          :key="tab"
          type="button"
          class="dashboard-pill"
          :class="{ 'dashboard-pill--active': activeTab === tab }"
          :aria-pressed="activeTab === tab"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </nav>
      <div v-if="activeTab === 'Applications'" class="career-toolbar__filters">
        <q-select
          v-model="statusFilter"
          dense
          outlined
          emit-value
          map-options
          :options="statusFilterOptions"
          label="Status"
          class="career-filter"
        />
        <q-input v-model="search" dense outlined clearable label="Search" class="career-search">
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>
    </div>

    <AppCard class="workspace-panel career-panel" padding="small" radius="lg">
      <!-- Loading -->
      <div v-if="loading" class="career-list" aria-busy="true">
        <div v-for="n in 5" :key="n" class="career-skeleton-row">
          <AppSkeleton variant="text" :lines="2" />
        </div>
      </div>

      <!-- Applications -->
      <template v-else-if="activeTab === 'Applications'">
        <div v-if="filteredApplications.length" class="workspace-scroll career-list">
          <button
            v-for="app in filteredApplications"
            :key="app.id"
            type="button"
            class="career-row hub-enter"
            @click="openApplication(app)"
          >
            <span class="career-row__main">
              <strong>{{ app.position }}</strong>
              <small>{{ app.company }} · {{ app.location }}</small>
            </span>
            <span
              v-if="app.followUpDate"
              class="career-row__followup"
              :title="`Follow up ${app.followUpDate}`"
            >
              <q-icon name="notifications_active" /> {{ app.followUpDate }}
            </span>
            <AppBadge :variant="statusVariant(app.status)" size="compact">{{ app.status }}</AppBadge>
            <span class="career-row__date">{{ app.appliedDate }}</span>
            <q-icon name="chevron_right" aria-hidden="true" />
          </button>
        </div>
        <div v-else class="workspace-empty">
          <AppEmptyState
            icon="work_off"
            title="No applications match"
            description="Adjust the filters or add a new application."
          />
        </div>
      </template>

      <!-- Interviews -->
      <div v-else-if="activeTab === 'Interviews'" class="workspace-scroll hub-grid career-pad">
        <AppCard v-for="iv in interviews" :key="iv.id" class="hub-card hub-enter" padding="small">
          <span class="hub-card__top">
            <span class="hub-card__title">{{ iv.company }}</span>
            <AppBadge variant="teal" size="compact">{{ iv.mode }}</AppBadge>
          </span>
          <p class="career-muted">{{ iv.round }} · {{ iv.date }}</p>
          <p class="career-note">{{ iv.notes }}</p>
        </AppCard>
      </div>

      <!-- Documents -->
      <div v-else-if="activeTab === 'Documents'" class="workspace-scroll hub-grid career-pad">
        <AppCard v-for="doc in careerDocuments" :key="doc.id" class="hub-card hub-enter" padding="small">
          <span class="hub-card__top">
            <span class="hub-card__title">{{ doc.name }}</span>
            <AppBadge variant="neutral" size="compact">{{ doc.type }}</AppBadge>
          </span>
          <p class="career-muted">Updated {{ doc.updated }}</p>
          <span class="career-soft-note">
            <q-icon name="cloud_off" /> File storage coming with Supabase
          </span>
        </AppCard>
      </div>

      <!-- Skills Gap -->
      <div v-else-if="activeTab === 'Skills Gap'" class="workspace-scroll career-pad career-skills">
        <div v-for="gap in skillGaps" :key="gap.id" class="career-skill hub-enter">
          <div class="career-skill__head">
            <strong>{{ gap.skill }}</strong>
            <small>{{ gap.current }}% → {{ gap.target }}% · {{ gap.learningPlan }}</small>
          </div>
          <AppProgress :value="gap.current" :label="`${gap.skill} current level`" />
        </div>
      </div>

      <!-- Career Roadmap -->
      <div v-else class="workspace-scroll hub-grid career-pad">
        <AppCard v-for="step in careerRoadmap" :key="step.id" class="hub-card hub-enter" padding="small">
          <span class="hub-card__top">
            <AppBadge variant="neutral" size="compact">{{ step.phase }}</AppBadge>
          </span>
          <span class="hub-card__title">{{ step.title }}</span>
          <p class="career-note">{{ step.detail }}</p>
        </AppCard>
      </div>
    </AppCard>

    <AppDetailPanel
      v-model="detailOpen"
      eyebrow="Application"
      :title="mode === 'view' ? (selected?.position ?? 'Application') : 'New application'"
      :description="mode === 'view' ? (selected?.company ?? '') : 'Track a role you’re pursuing.'"
    >
      <dl v-if="mode === 'view' && selected" class="workspace-detail-stack">
        <div class="workspace-detail-row"><dt>Company</dt><dd>{{ selected.company }}</dd></div>
        <div class="workspace-detail-row"><dt>Type</dt><dd>{{ selected.jobType }}</dd></div>
        <div class="workspace-detail-row"><dt>Location</dt><dd>{{ selected.location }}</dd></div>
        <div class="workspace-detail-row"><dt>Salary</dt><dd>{{ selected.salaryRange || '—' }}</dd></div>
        <div class="workspace-detail-row">
          <dt>Status</dt>
          <dd><AppBadge :variant="statusVariant(selected.status)">{{ selected.status }}</AppBadge></dd>
        </div>
        <div class="workspace-detail-row"><dt>Applied</dt><dd>{{ selected.appliedDate }}</dd></div>
        <div class="workspace-detail-row">
          <dt>Follow-up</dt><dd>{{ selected.followUpDate || 'None' }}</dd>
        </div>
        <div class="workspace-detail-row"><dt>Contact</dt><dd>{{ selected.contactPerson || '—' }}</dd></div>
        <div class="workspace-detail-row"><dt>CV</dt><dd>{{ selected.cvVersion || '—' }}</dd></div>
        <div class="workspace-detail-row"><dt>Portfolio</dt><dd>{{ selected.portfolioVersion || '—' }}</dd></div>
        <div v-if="selected.notes" class="workspace-detail-row"><dt>Notes</dt><dd>{{ selected.notes }}</dd></div>
      </dl>
      <form v-else id="application-form" @submit.prevent="saveApplication">
        <label class="workspace-field"><span class="workspace-field__label">Company</span><q-input v-model="draft.company" outlined autofocus /></label>
        <label class="workspace-field"><span class="workspace-field__label">Position</span><q-input v-model="draft.position" outlined /></label>
        <label class="workspace-field"><span class="workspace-field__label">Job type</span><q-select v-model="draft.jobType" outlined :options="jobTypes" /></label>
        <label class="workspace-field"><span class="workspace-field__label">Location</span><q-input v-model="draft.location" outlined /></label>
        <label class="workspace-field"><span class="workspace-field__label">Salary range</span><q-input v-model="draft.salaryRange" outlined /></label>
        <label class="workspace-field"><span class="workspace-field__label">Status</span><q-select v-model="draft.status" outlined :options="applicationStatuses" /></label>
        <label class="workspace-field"><span class="workspace-field__label">Job URL</span><q-input v-model="draft.jobUrl" outlined type="url" /></label>
        <label class="workspace-field"><span class="workspace-field__label">Follow-up date</span><q-input v-model="draft.followUpDate" outlined type="date" /></label>
        <label class="workspace-field"><span class="workspace-field__label">Notes</span><q-input v-model="draft.notes" outlined type="textarea" autogrow /></label>
      </form>
      <template #actions>
        <AppButton
          v-if="mode === 'view'"
          variant="ghost"
          icon-left="open_in_new"
          :disabled="!selected?.jobUrl"
          @click="openJobUrl"
        >Open posting</AppButton>
        <AppButton
          v-else
          type="submit"
          form="application-form"
          :disabled="!draft.company.trim() || !draft.position.trim()"
        >Add application</AppButton>
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
import {
  applicationStatuses,
  careerDocuments,
  careerRoadmap,
  interviews,
  jobApplications,
  jobTypes,
  skillGaps,
} from '@/data/career.mock';
import type { ApplicationStatus, JobApplication, JobType } from '@/data/career.mock';

type CareerTab = 'Applications' | 'Interviews' | 'Documents' | 'Skills Gap' | 'Career Roadmap';

const $q = useQuasar();
const { loading } = useMockLoad();
const tabs: CareerTab[] = ['Applications', 'Interviews', 'Documents', 'Skills Gap', 'Career Roadmap'];
const activeTab = ref<CareerTab>('Applications');
const applications = ref<JobApplication[]>(jobApplications.map((a) => ({ ...a })));
const statusFilter = ref<ApplicationStatus | 'All'>('All');
const search = ref('');
const detailOpen = ref(false);
const mode = ref<'view' | 'form'>('view');
const selected = ref<JobApplication | null>(null);

const statusFilterOptions = ['All', ...applicationStatuses];

const draft = reactive<{
  company: string;
  position: string;
  jobType: JobType;
  location: string;
  salaryRange: string;
  status: ApplicationStatus;
  jobUrl: string;
  followUpDate: string;
  notes: string;
}>({
  company: '',
  position: '',
  jobType: 'Full-time',
  location: '',
  salaryRange: '',
  status: 'Applied',
  jobUrl: '',
  followUpDate: '',
  notes: '',
});

const filteredApplications = computed(() => {
  const q = search.value.trim().toLowerCase();
  return applications.value.filter(
    (a) =>
      (statusFilter.value === 'All' || a.status === statusFilter.value) &&
      (!q || `${a.company} ${a.position}`.toLowerCase().includes(q)),
  );
});

const stats = computed(() => {
  const active = applications.value.filter(
    (a) => !['Rejected', 'Accepted'].includes(a.status),
  ).length;
  return [
    { label: 'Active applications', value: active, detail: 'In progress' },
    { label: 'Interviews', value: interviews.length, detail: 'Scheduled' },
    { label: 'Offers', value: applications.value.filter((a) => a.status === 'Offer').length, detail: 'Awaiting decision' },
    { label: 'Follow-ups due', value: applications.value.filter((a) => a.followUpDate).length, detail: 'Reach out soon' },
  ];
});

function statusVariant(status: ApplicationStatus): 'neutral' | 'mint' | 'teal' | 'dark' {
  if (status === 'Offer' || status === 'Accepted') return 'mint';
  if (status === 'Rejected') return 'dark';
  if (status === 'Interview' || status === 'Technical test') return 'teal';
  return 'neutral';
}
function openApplication(app: JobApplication) {
  selected.value = app;
  mode.value = 'view';
  detailOpen.value = true;
}
function openCreate() {
  selected.value = null;
  Object.assign(draft, {
    company: '',
    position: '',
    jobType: 'Full-time',
    location: '',
    salaryRange: '',
    status: 'Applied',
    jobUrl: '',
    followUpDate: '',
    notes: '',
  });
  mode.value = 'form';
  detailOpen.value = true;
}
function saveApplication() {
  if (!draft.company.trim() || !draft.position.trim()) return;
  applications.value.unshift({
    id: Date.now(),
    company: draft.company.trim(),
    position: draft.position.trim(),
    jobType: draft.jobType,
    location: draft.location.trim() || 'Remote',
    salaryRange: draft.salaryRange.trim(),
    appliedDate: 'Today',
    status: draft.status,
    jobUrl: draft.jobUrl.trim(),
    contactPerson: '',
    followUpDate: draft.followUpDate,
    notes: draft.notes.trim(),
    cvVersion: '',
    portfolioVersion: '',
  });
  detailOpen.value = false;
  $q.notify({ type: 'positive', message: 'Application added (mock — not saved yet)', timeout: 1600 });
}
function openJobUrl() {
  if (selected.value?.jobUrl) window.open(selected.value.jobUrl, '_blank', 'noopener');
}
</script>

<style scoped lang="scss">
.career-toolbar {
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.career-toolbar__filters {
  display: flex;
  gap: var(--space-2);
}
.career-filter {
  width: 150px;
}
.career-search {
  width: 200px;
}
.career-panel {
  display: flex;
  flex-direction: column;
}
.career-list {
  display: flex;
  flex-direction: column;
  padding: var(--space-1);
}
.career-skeleton-row {
  padding: var(--space-3);
  border-bottom: var(--border-thin);
}
.career-pad {
  padding: var(--space-2);
}
.career-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto 64px 20px;
  align-items: center;
  gap: var(--space-3);
  min-height: 56px;
  padding: var(--space-2) var(--space-3);
  color: var(--color-text);
  text-align: left;
  border-bottom: var(--border-thin);
  border-radius: var(--radius-sm);
}
.career-row:hover {
  background: color-mix(in srgb, var(--color-text) 5%, transparent);
}
.career-row__main {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.career-row__main strong {
  overflow: hidden;
  font-size: 0.92rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.career-row__main small,
.career-row__date {
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.72rem;
}
.career-row__followup {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-warning);
  font-family: var(--font-control);
  font-size: 0.7rem;
  white-space: nowrap;
}
.career-muted {
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.74rem;
}
.career-note {
  font-size: 0.8rem;
  line-height: 1.35;
  opacity: 0.85;
}
.career-soft-note {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.72rem;
}
.career-skills {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.career-skill__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}
.career-skill__head small {
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.7rem;
}
@media (max-width: 600px) {
  .career-search,
  .career-filter {
    flex: 1;
    width: auto;
  }
  .career-row {
    grid-template-columns: minmax(0, 1fr) auto 20px;
  }
  .career-row__followup,
  .career-row__date {
    display: none;
  }
}
</style>
