<template>
  <main class="dashboard-content-page integrations-page">
    <DashboardPageHeader
      eyebrow="Integrations"
      title="Connected Apps"
      description="Connect services and bring useful information into one personal workspace."
    >
      <template #action>
        <AppButton variant="ghost" icon-left="shield" @click="securityOpen = true"
          >Security &amp; privacy</AppButton
        >
      </template>
    </DashboardPageHeader>

    <section class="hub-stats" aria-label="Integration overview">
      <AppCard v-for="stat in stats" :key="stat.label" class="hub-stat" padding="small">
        <span>{{ stat.label }}</span
        ><strong>{{ stat.value }}</strong
        ><small>{{ stat.detail }}</small>
      </AppCard>
    </section>

    <div class="workspace-toolbar integrations-note-bar" role="note">
      <q-icon name="lock" aria-hidden="true" />
      <p>{{ integrationSecurityNote }}</p>
    </div>

    <div class="workspace-toolbar integrations-toolbar">
      <nav class="dashboard-pill-nav" aria-label="Integration categories">
        <button
          v-for="category in categoryTabs"
          :key="category"
          type="button"
          class="dashboard-pill"
          :class="{ 'dashboard-pill--active': activeCategory === category }"
          :aria-pressed="activeCategory === category"
          @click="activeCategory = category"
        >
          {{ category }}
        </button>
      </nav>
      <div class="integrations-toolbar__side">
        <q-input
          v-model="search"
          class="integrations-search"
          outlined
          dense
          clearable
          label="Search services"
          aria-label="Search services"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
        <button
          type="button"
          class="dashboard-pill"
          :class="{ 'dashboard-pill--active': connectedOnly }"
          :aria-pressed="connectedOnly"
          @click="connectedOnly = !connectedOnly"
        >
          Connected
        </button>
        <span class="workspace-meta"
          >{{ visibleIntegrations.length }} of {{ integrations.length }}</span
        >
      </div>
    </div>

    <AppCard class="workspace-panel integrations-panel" padding="small" radius="lg">
      <div
        v-if="loading"
        class="workspace-scroll integrations-grid integrations-pad"
        aria-busy="true"
      >
        <AppSkeleton v-for="n in 8" :key="n" variant="card" height="170px" />
      </div>
      <div
        v-else-if="visibleIntegrations.length"
        class="workspace-scroll integrations-grid integrations-pad"
      >
        <IntegrationCard
          v-for="service in visibleIntegrations"
          :key="service.id"
          :service="service"
          @connect="connect"
          @details="openService"
        />
      </div>
      <div v-else class="workspace-empty">
        <AppEmptyState
          icon="search_off"
          title="No services match"
          description="Try a different search or category."
        />
      </div>
    </AppCard>

    <AppDetailPanel
      v-model="detailOpen"
      eyebrow="Integration"
      :title="selected?.name ?? 'Integration'"
      :description="selected?.description ?? ''"
    >
      <dl v-if="selected" class="workspace-detail-stack">
        <div class="workspace-detail-row">
          <dt>Status</dt>
          <dd>{{ selected.status }}</dd>
        </div>
        <div class="workspace-detail-row">
          <dt>Category</dt>
          <dd>{{ selected.category }}</dd>
        </div>
        <div class="workspace-detail-row">
          <dt>Account</dt>
          <dd>{{ selected.account || 'Not connected' }}</dd>
        </div>
        <div class="workspace-detail-row">
          <dt>Permissions</dt>
          <dd>{{ selected.permissions.join(', ') }}</dd>
        </div>
        <div class="workspace-detail-row">
          <dt>Last sync</dt>
          <dd>{{ selected.lastSynced || 'Never' }}</dd>
        </div>
        <div class="workspace-detail-row">
          <dt>Frequency</dt>
          <dd>{{ selected.syncFrequency }}</dd>
        </div>
      </dl>
      <template v-if="selected">
        <h3 class="integration-detail__heading">Dashboard data</h3>
        <ul class="integration-capabilities">
          <li v-for="capability in selected.capabilities" :key="capability">
            <q-icon name="check_circle" aria-hidden="true" /> {{ capability }}
          </li>
        </ul>
        <p v-if="!selected.connectEnabled" class="integration-privacy">
          <q-icon name="admin_panel_settings" aria-hidden="true" />
          {{ connectionRequirement(selected) }} Nothing is requested or stored until that secure
          connector exists.
        </p>
        <p v-else class="integration-privacy">
          <q-icon name="privacy_tip" aria-hidden="true" />
          Access uses a minimal token you create and control — the app never sees your password, and
          you can disconnect here or revoke the token at the provider anytime.
        </p>
      </template>
      <template #actions>
        <AppButton
          variant="ghost"
          icon-left="link_off"
          :disabled="selected?.status !== 'Connected'"
          @click="disconnect"
          >Disconnect</AppButton
        >
        <span :title="selected?.connectEnabled ? 'Link your account' : 'Provider backend required'">
          <AppButton
            icon-left="bolt"
            :disabled="!selected?.connectEnabled || selected?.status === 'Connected'"
            @click="connect(selected)"
          >
            {{ selected?.connectEnabled ? 'Connect' : 'Setup required' }}
          </AppButton>
        </span>
      </template>
    </AppDetailPanel>

    <q-dialog v-model="githubDialogOpen">
      <AppCard class="integration-security-dialog" padding="large" radius="lg">
        <h2>Connect GitHub</h2>
        <p>
          Create a <strong>fine-grained personal access token</strong> at github.com → Settings →
          Developer settings, with read-only access to the repositories you want tracked. It is
          validated against GitHub, then stored in your own database row (owner-only access).
        </p>
        <a
          class="integration-provider-link"
          href="https://github.com/settings/personal-access-tokens/new"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open GitHub token settings <q-icon name="open_in_new" aria-hidden="true" />
        </a>
        <q-input
          v-model="githubToken"
          class="integration-token-input"
          outlined
          dense
          type="password"
          label="Personal access token"
          autocomplete="off"
          :disable="githubBusy"
          @keyup.enter="submitGitHubToken"
        />
        <div class="integration-security-dialog__actions">
          <AppButton variant="ghost" :disabled="githubBusy" @click="githubDialogOpen = false"
            >Cancel</AppButton
          >
          <AppButton
            icon-left="bolt"
            :disabled="githubBusy || !githubToken.trim()"
            @click="submitGitHubToken"
          >
            {{ githubBusy ? 'Connecting…' : 'Connect' }}
          </AppButton>
        </div>
      </AppCard>
    </q-dialog>

    <q-dialog v-model="securityOpen">
      <AppCard class="integration-security-dialog" padding="large" radius="lg">
        <h2>Security &amp; privacy</h2>
        <p>{{ integrationSecurityNote }}</p>
        <ul>
          <li>Tokens live in your own database rows, protected by row-level security.</li>
          <li>Tokens are sent only to the provider they belong to — nowhere else.</li>
          <li>Each integration only requests the minimum permissions listed.</li>
          <li>You can disconnect here and revoke the token at the provider anytime.</li>
        </ul>
        <div class="integration-security-dialog__actions">
          <AppButton @click="securityOpen = false">Got it</AppButton>
        </div>
      </AppCard>
    </q-dialog>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppDetailPanel from '@/components/ui/AppDetailPanel.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader.vue';
import IntegrationCard from '@/components/integrations/IntegrationCard.vue';
import { useMockLoad } from '@/composables/useMockLoad';
import {
  integrationCategories,
  integrations as integrationsCatalog,
  integrationSecurityNote,
} from '@/data/integrations.mock';
import type { Integration, IntegrationCategory } from '@/data/integrations.mock';
import {
  connectGitHub,
  disconnectProvider,
  getConnectedAccounts,
} from '@/services/supabase/integrations.service';

type CategoryTab = 'All' | IntegrationCategory;

const $q = useQuasar();
const { loading } = useMockLoad();
const integrations = ref<Integration[]>(integrationsCatalog.map((service) => ({ ...service })));
const categoryTabs: CategoryTab[] = ['All', ...integrationCategories];
const activeCategory = ref<CategoryTab>('All');
const search = ref<string | null>('');
const connectedOnly = ref(false);
const detailOpen = ref(false);
const securityOpen = ref(false);
const selected = ref<Integration | null>(null);
const githubDialogOpen = ref(false);
const githubToken = ref('');
const githubBusy = ref(false);

function markConnected(providerId: string, account: string, connectedAt?: string) {
  const service = integrations.value.find((s) => s.id === providerId);
  if (!service) return;
  service.status = 'Connected';
  service.account = account;
  service.lastSynced = connectedAt
    ? new Date(connectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Just now';
}

onMounted(async () => {
  try {
    for (const account of await getConnectedAccounts())
      markConnected(account.provider, account.accountLabel, account.connectedAt);
  } catch {
    // Not signed in or table missing — leave everything "Not connected".
  }
});

const visibleIntegrations = computed(() => {
  const query = (search.value ?? '').trim().toLocaleLowerCase();
  return integrations.value
    .filter((service) => {
      if (activeCategory.value !== 'All' && service.category !== activeCategory.value) return false;
      if (connectedOnly.value && service.status !== 'Connected') return false;
      if (query && !`${service.name} ${service.description}`.toLocaleLowerCase().includes(query))
        return false;
      return true;
    })
    .sort((a, b) => Number(b.status === 'Connected') - Number(a.status === 'Connected'));
});

const stats = computed(() => [
  { label: 'Catalog', value: integrations.value.length, detail: 'Services shown' },
  {
    label: 'Connected',
    value: integrations.value.filter((s) => s.status === 'Connected').length,
    detail: 'Active',
  },
  {
    label: 'Ready to link',
    value: integrations.value.filter((s) => s.status === 'Not connected' && s.connectEnabled)
      .length,
    detail: 'Connect now',
  },
  {
    label: 'Needs setup',
    value: integrations.value.filter((s) => s.status === 'Coming soon').length,
    detail: 'Provider backend',
  },
]);

function openService(service: Integration) {
  selected.value = service;
  detailOpen.value = true;
}
function connectionRequirement(service: Integration) {
  if (service.id === 'pagespeed-insights')
    return 'This service needs a saved website URL and a rate-limited server proxy.';
  if (service.category === 'Google' || service.id === 'google-analytics')
    return 'This service needs Google OAuth credentials and an authenticated server callback.';
  return 'This service needs provider credentials and an authenticated server-side connector.';
}
function connect(service: Integration | null) {
  if (!service) return;
  if (service.status === 'Connected') {
    openService(service);
    return;
  }
  if (service.id === 'github') {
    githubToken.value = '';
    githubDialogOpen.value = true;
    return;
  }
  $q.notify({
    message: `${service.name} is coming soon`,
    caption: 'Prepared in the interface — no credentials are requested or stored yet.',
    timeout: 1800,
  });
}
async function submitGitHubToken() {
  githubBusy.value = true;
  try {
    const login = await connectGitHub(githubToken.value);
    markConnected('github', login);
    githubDialogOpen.value = false;
    githubToken.value = '';
    $q.notify({ type: 'positive', message: `GitHub connected as ${login}`, timeout: 2000 });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not connect GitHub.',
      timeout: 3000,
    });
  } finally {
    githubBusy.value = false;
  }
}
async function disconnect() {
  const service = selected.value;
  if (!service) return;
  if (service.status !== 'Connected') {
    $q.notify({ message: `${service.name} is not connected`, timeout: 1400 });
    return;
  }
  try {
    await disconnectProvider(service.id);
    service.status = service.connectEnabled ? 'Not connected' : 'Coming soon';
    service.account = '';
    service.lastSynced = '';
    detailOpen.value = false;
    $q.notify({ type: 'positive', message: `${service.name} disconnected`, timeout: 1600 });
  } catch {
    $q.notify({
      type: 'negative',
      message: `Could not disconnect ${service.name}.`,
      timeout: 2400,
    });
  }
}
</script>

<style scoped lang="scss">
.integrations-note-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: var(--border-thin);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  color: var(--color-text-secondary);
  font-size: 0.78rem;
}
.integrations-note-bar .q-icon {
  color: var(--color-primary);
  font-size: 1.1rem;
}
.integrations-toolbar {
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.integrations-toolbar__side {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}
.integrations-search {
  width: 210px;
  font-family: var(--font-control);
}
.integrations-panel {
  display: flex;
  flex-direction: column;
}
.integrations-pad {
  padding: var(--space-2);
}
.integrations-grid {
  display: grid;
  align-content: start;
  grid-template-columns: repeat(auto-fill, minmax(235px, 1fr));
  grid-auto-rows: 1fr;
  gap: var(--space-2);
}
.integration-detail__heading {
  margin: var(--space-3) 0 var(--space-1);
  font-family: var(--font-heading);
  font-size: 0.92rem;
}
.integration-capabilities {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  list-style: none;
  font-size: 0.82rem;
}
.integration-capabilities li {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.integration-capabilities .q-icon {
  color: var(--color-primary);
  font-size: 1rem;
}
.integration-privacy {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-text) 5%, transparent);
  color: var(--color-text-secondary);
  font-size: 0.78rem;
  line-height: 1.4;
}
.integration-privacy .q-icon {
  color: var(--color-primary);
  font-size: 1.1rem;
}
.integration-security-dialog {
  width: min(460px, 92vw);
}
.integration-security-dialog h2 {
  font-family: var(--font-heading);
  font-size: 1.3rem;
}
.integration-security-dialog p {
  margin-top: var(--space-2);
  color: var(--color-text-secondary);
  font-size: 0.85rem;
}
.integration-security-dialog ul {
  margin: var(--space-3) 0 0 var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: 0.82rem;
}
.integration-security-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-4);
}
.integration-token-input {
  margin-top: var(--space-3);
  font-family: var(--font-control);
}
.integration-provider-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin-top: var(--space-2);
  color: var(--color-primary);
  font-family: var(--font-control);
  font-size: 0.82rem;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
@media (max-width: 767px) {
  .integrations-toolbar__side {
    width: 100%;
    margin-left: 0;
  }
  .integrations-search {
    flex: 1;
    min-width: 0;
  }
}
</style>
