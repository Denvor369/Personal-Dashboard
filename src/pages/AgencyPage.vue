<template>
  <main class="dashboard-content-page agency-page">
    <DashboardPageHeader
      eyebrow="Business workspace"
      title="Agency Hub"
      description="Organize clients, services, deliverables, proposals, and agency growth."
    >
      <template #action>
        <AppButton variant="dark" icon-left="add" @click="openCreate">Add client</AppButton>
      </template>
    </DashboardPageHeader>

    <div class="agency-early" role="note">
      <q-icon name="construction" aria-hidden="true" />
      <span>Early workspace — a foundation for the future agency. Mock data, not persistent yet.</span>
    </div>

    <section class="hub-stats" aria-label="Agency overview">
      <AppCard v-for="stat in stats" :key="stat.label" class="hub-stat" padding="small">
        <span>{{ stat.label }}</span><strong>{{ stat.value }}</strong><small>{{ stat.detail }}</small>
      </AppCard>
    </section>

    <div class="workspace-toolbar">
      <nav class="dashboard-pill-nav" aria-label="Agency sections">
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
    </div>

    <AppCard class="workspace-panel agency-panel" padding="small" radius="lg">
      <div v-if="loading" class="workspace-scroll hub-grid agency-pad" aria-busy="true">
        <AppSkeleton v-for="n in 4" :key="n" variant="card" height="130px" />
      </div>

      <!-- Overview -->
      <div v-else-if="activeTab === 'Overview'" class="workspace-scroll agency-pad agency-overview">
        <AppCard class="hub-card hub-enter" padding="small">
          <span class="hub-card__title">Active projects</span>
          <div v-for="p in agencyProjects" :key="p.id" class="agency-mini">
            <span>{{ p.name }}</span>
            <AppProgress :value="p.progress" :label="`${p.name} progress`" />
          </div>
        </AppCard>
        <AppCard class="hub-card hub-enter" padding="small">
          <span class="hub-card__title">Deliverables due</span>
          <div v-for="d in deliverables" :key="d.id" class="agency-deliverable">
            <q-icon :name="d.done ? 'task_alt' : 'radio_button_unchecked'" />
            <span :class="{ 'agency-deliverable--done': d.done }">{{ d.title }}</span>
            <small>{{ d.due }}</small>
          </div>
        </AppCard>
      </div>

      <!-- Clients -->
      <div v-else-if="activeTab === 'Clients'" class="workspace-scroll hub-grid agency-pad">
        <button v-for="client in clients" :key="client.id" type="button" class="hub-card hub-enter agency-client" @click="openClient(client)">
          <span class="hub-card__top">
            <span class="hub-card__title">{{ client.businessName }}</span>
            <AppBadge :variant="clientVariant(client.status)" size="compact">{{ client.status }}</AppBadge>
          </span>
          <span class="hub-card__meta">
            <span><q-icon name="person" /> {{ client.contactName }}</span>
            <span><q-icon name="category" /> {{ client.industry }}</span>
          </span>
          <p class="agency-client__services">{{ client.services.join(' · ') || 'No services yet' }}</p>
        </button>
      </div>

      <!-- Services -->
      <div v-else-if="activeTab === 'Services'" class="workspace-scroll hub-grid agency-pad">
        <AppCard v-for="service in agencyServices" :key="service.id" class="hub-card hub-enter" padding="small">
          <span class="hub-card__top">
            <span class="hub-card__title">{{ service.name }}</span>
            <AppBadge variant="neutral" size="compact">{{ service.startingPrice }}</AppBadge>
          </span>
          <p class="agency-service__desc">{{ service.description }}</p>
        </AppCard>
      </div>

      <!-- Projects -->
      <div v-else-if="activeTab === 'Projects'" class="workspace-scroll hub-grid agency-pad">
        <AppCard v-for="p in agencyProjects" :key="p.id" class="hub-card hub-enter" padding="small">
          <span class="hub-card__top">
            <span class="hub-card__title">{{ p.name }}</span>
            <AppBadge variant="teal" size="compact">{{ p.status }}</AppBadge>
          </span>
          <p class="agency-muted">{{ p.client }}</p>
          <AppProgress :value="p.progress" :label="`${p.name} progress`" />
        </AppCard>
      </div>

      <!-- Proposals (foundation only) -->
      <div v-else-if="activeTab === 'Proposals'" class="workspace-empty">
        <AppEmptyState
          icon="description"
          title="Proposals coming soon"
          description="Draft, send, and track proposals here once the agency workspace grows."
        />
      </div>

      <!-- Deliverables -->
      <div v-else class="workspace-scroll agency-pad agency-deliverables">
        <div v-for="d in deliverables" :key="d.id" class="agency-deliverable-row hub-enter">
          <q-checkbox :model-value="d.done" :aria-label="`Toggle ${d.title}`" @update:model-value="d.done = !d.done" />
          <span class="agency-deliverable-row__main" :class="{ 'agency-deliverable--done': d.done }">
            <strong>{{ d.title }}</strong><small>{{ d.client }}</small>
          </span>
          <span class="agency-deliverable-row__due">{{ d.due }}</span>
        </div>
      </div>
    </AppCard>

    <AppDetailPanel
      v-model="detailOpen"
      eyebrow="Client"
      :title="mode === 'view' ? (selected?.businessName ?? 'Client') : 'New client'"
      :description="mode === 'view' ? (selected?.industry ?? '') : 'Add a client to the workspace.'"
    >
      <dl v-if="mode === 'view' && selected" class="workspace-detail-stack">
        <div class="workspace-detail-row"><dt>Contact</dt><dd>{{ selected.contactName }}</dd></div>
        <div class="workspace-detail-row"><dt>Email</dt><dd>{{ selected.email || '—' }}</dd></div>
        <div class="workspace-detail-row"><dt>Phone</dt><dd>{{ selected.phone || '—' }}</dd></div>
        <div class="workspace-detail-row"><dt>Industry</dt><dd>{{ selected.industry }}</dd></div>
        <div class="workspace-detail-row"><dt>Status</dt><dd><AppBadge :variant="clientVariant(selected.status)">{{ selected.status }}</AppBadge></dd></div>
        <div class="workspace-detail-row"><dt>Services</dt><dd>{{ selected.services.join(', ') || '—' }}</dd></div>
        <div class="workspace-detail-row"><dt>Projects</dt><dd>{{ selected.projectCount }}</dd></div>
        <div v-if="selected.notes" class="workspace-detail-row"><dt>Notes</dt><dd>{{ selected.notes }}</dd></div>
      </dl>
      <form v-else id="client-form" @submit.prevent="saveClient">
        <label class="workspace-field"><span class="workspace-field__label">Business name</span><q-input v-model="draft.businessName" outlined autofocus /></label>
        <label class="workspace-field"><span class="workspace-field__label">Contact name</span><q-input v-model="draft.contactName" outlined /></label>
        <label class="workspace-field"><span class="workspace-field__label">Email</span><q-input v-model="draft.email" outlined type="email" /></label>
        <label class="workspace-field"><span class="workspace-field__label">Phone</span><q-input v-model="draft.phone" outlined /></label>
        <label class="workspace-field"><span class="workspace-field__label">Industry</span><q-input v-model="draft.industry" outlined /></label>
        <label class="workspace-field"><span class="workspace-field__label">Status</span><q-select v-model="draft.status" outlined :options="clientStatuses" /></label>
      </form>
      <template #actions>
        <AppButton v-if="mode === 'form'" type="submit" form="client-form" :disabled="!draft.businessName.trim()">Add client</AppButton>
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
  agencyClients,
  agencyProjects,
  agencyServices,
  clientStatuses,
  deliverables as deliverablesMock,
} from '@/data/agency.mock';
import type { AgencyClient, ClientStatus } from '@/data/agency.mock';

type AgencyTab = 'Overview' | 'Clients' | 'Services' | 'Projects' | 'Proposals' | 'Deliverables';

const $q = useQuasar();
const { loading } = useMockLoad();
const tabs: AgencyTab[] = ['Overview', 'Clients', 'Services', 'Projects', 'Proposals', 'Deliverables'];
const activeTab = ref<AgencyTab>('Overview');
const clients = ref<AgencyClient[]>(agencyClients.map((c) => ({ ...c, services: [...c.services] })));
const deliverables = ref(deliverablesMock.map((d) => ({ ...d })));
const detailOpen = ref(false);
const mode = ref<'view' | 'form'>('view');
const selected = ref<AgencyClient | null>(null);

const draft = reactive<{
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string;
  status: ClientStatus;
}>({
  businessName: '',
  contactName: '',
  email: '',
  phone: '',
  industry: '',
  status: 'Lead',
});

const stats = computed(() => [
  { label: 'Active clients', value: clients.value.filter((c) => c.status === 'Active').length, detail: 'Working with' },
  { label: 'Active projects', value: agencyProjects.filter((p) => p.status !== 'Delivered').length, detail: 'In flight' },
  { label: 'Monthly revenue', value: '—', detail: 'Placeholder' },
  { label: 'Deliverables due', value: deliverables.value.filter((d) => !d.done).length, detail: 'Open' },
]);

function clientVariant(status: ClientStatus): 'neutral' | 'mint' | 'teal' | 'dark' {
  if (status === 'Active') return 'teal';
  if (status === 'Completed') return 'mint';
  if (status === 'Archived') return 'dark';
  return 'neutral';
}
function openClient(client: AgencyClient) {
  selected.value = client;
  mode.value = 'view';
  detailOpen.value = true;
}
function openCreate() {
  selected.value = null;
  Object.assign(draft, { businessName: '', contactName: '', email: '', phone: '', industry: '', status: 'Lead' });
  mode.value = 'form';
  detailOpen.value = true;
}
function saveClient() {
  if (!draft.businessName.trim()) return;
  clients.value.unshift({
    id: Date.now(),
    businessName: draft.businessName.trim(),
    contactName: draft.contactName.trim(),
    email: draft.email.trim(),
    phone: draft.phone.trim(),
    industry: draft.industry.trim() || 'General',
    status: draft.status,
    services: [],
    projectCount: 0,
    notes: '',
  });
  detailOpen.value = false;
  $q.notify({ type: 'positive', message: 'Client added (mock — not saved yet)', timeout: 1600 });
}
</script>

<style scoped lang="scss">
.agency-early {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-family: var(--font-control);
  font-size: 0.76rem;
}
.agency-early .q-icon {
  color: var(--color-primary);
  font-size: 1.1rem;
}
.agency-panel {
  display: flex;
  flex-direction: column;
}
.agency-pad {
  padding: var(--space-2);
}
.agency-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-2);
  align-content: start;
}
.agency-mini {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: 0.8rem;
}
.agency-mini + .agency-mini {
  margin-top: var(--space-2);
}
.agency-deliverable {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.82rem;
}
.agency-deliverable + .agency-deliverable {
  margin-top: var(--space-1);
}
.agency-deliverable small {
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.7rem;
}
.agency-deliverable--done {
  opacity: 0.55;
  text-decoration: line-through;
}
.agency-client {
  cursor: pointer;
}
.agency-client__services {
  margin-top: auto;
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.72rem;
}
.agency-service__desc,
.agency-muted {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.35;
}
.agency-deliverables {
  display: flex;
  flex-direction: column;
}
.agency-deliverable-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-2);
  min-height: 52px;
  padding: var(--space-1) var(--space-2);
  border-bottom: var(--border-thin);
}
.agency-deliverable-row__main {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.agency-deliverable-row__main small {
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.7rem;
}
.agency-deliverable-row__due {
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.72rem;
}
</style>
