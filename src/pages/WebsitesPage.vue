<template>
  <main class="dashboard-content-page websites-page">
    <DashboardPageHeader
      eyebrow="Web operations"
      title="Website Command Center"
      description="Monitor and manage all websites, domains, deployments, and technical resources."
    >
      <template #action>
        <AppButton variant="dark" icon-left="add" @click="openCreate">Add website</AppButton>
      </template>
    </DashboardPageHeader>

    <section class="hub-stats" aria-label="Website overview">
      <AppCard v-for="stat in stats" :key="stat.label" class="hub-stat" padding="small">
        <span>{{ stat.label }}</span><strong>{{ stat.value }}</strong><small>{{ stat.detail }}</small>
      </AppCard>
    </section>

    <div class="workspace-toolbar">
      <nav class="dashboard-pill-nav" aria-label="Website filters">
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
      <span class="workspace-meta">{{ visibleWebsites.length }} sites</span>
    </div>

    <AppCard class="workspace-panel websites-panel" padding="small" radius="lg">
      <div v-if="loading" class="workspace-scroll hub-grid websites-pad" aria-busy="true">
        <AppSkeleton v-for="n in 4" :key="n" variant="card" height="190px" />
      </div>

      <div v-else-if="visibleWebsites.length" class="workspace-scroll hub-grid websites-pad">
        <article v-for="site in visibleWebsites" :key="site.id" class="hub-card hub-enter website-card">
          <span class="hub-card__top">
            <span class="website-card__status">
              <span class="website-card__dot" :data-status="site.status" aria-hidden="true" />
              {{ site.status }}
            </span>
            <AppBadge v-if="site.openIssues" variant="dark" size="compact">{{ site.openIssues }} issues</AppBadge>
          </span>
          <button type="button" class="website-card__headline" @click="openWebsite(site)">
            <span class="hub-card__title">{{ site.name }}</span>
            <small>{{ site.domain }}</small>
          </button>
          <span class="hub-card__meta">
            <span><q-icon name="code" /> {{ site.framework }}</span>
            <span><q-icon name="dns" /> {{ site.hosting }}</span>
            <span><q-icon name="rocket_launch" /> {{ site.lastDeployment }}</span>
          </span>
          <div class="website-card__actions">
            <AppIconButton icon="open_in_new" label="Open site" size="small" :disabled="!site.productionUrl" @click="openUrl(site.productionUrl)" />
            <AppIconButton icon="code" label="Open repository" size="small" :disabled="!site.repositoryUrl" @click="openUrl(site.repositoryUrl)" />
            <AppIconButton icon="admin_panel_settings" label="Open admin" size="small" :disabled="!site.adminUrl" @click="openUrl(site.adminUrl)" />
            <AppButton variant="ghost" size="small" @click="openWebsite(site)">Details</AppButton>
          </div>
        </article>
      </div>

      <div v-else class="workspace-empty">
        <AppEmptyState icon="public_off" title="No websites here" description="Add a site or switch tabs." />
      </div>
    </AppCard>

    <AppCard class="workspace-panel search-panel" padding="medium" radius="lg">
      <header class="search-panel__header">
        <div>
          <p class="dashboard-eyebrow">Search console</p>
          <h2>Search performance</h2>
        </div>
        <q-select
          v-model="propertyId"
          class="search-panel__property"
          outlined
          dense
          emit-value
          map-options
          :options="propertyOptions"
          aria-label="Search Console property"
        >
          <template #prepend><q-icon name="travel_explore" /></template>
        </q-select>
      </header>

      <template v-if="perf">
        <div class="search-tiles">
          <button
            v-for="tile in metricTiles"
            :key="tile.key"
            type="button"
            class="search-tile"
            :class="{ 'search-tile--active': metric === tile.key }"
            :aria-pressed="metric === tile.key"
            @click="metric = tile.key"
          >
            <span>{{ tile.label }}</span>
            <strong>{{ tile.value }}</strong>
          </button>
          <div v-for="tile in staticTiles" :key="tile.label" class="search-tile search-tile--static">
            <span>{{ tile.label }}</span>
            <strong>{{ tile.value }}</strong>
          </div>
        </div>

        <div class="search-chart">
          <div class="search-chart__plot">
            <span class="search-chart__scale search-chart__scale--top">{{ fmtCompact(chartMax) }}</span>
            <span class="search-chart__scale search-chart__scale--bottom">0</span>
            <svg
              viewBox="0 0 400 140"
              preserveAspectRatio="none"
              role="img"
              :aria-label="`28-day ${metric} chart for ${selectedProperty?.searchConsoleProperty}`"
            >
              <defs>
                <linearGradient id="search-perf-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="var(--color-primary)" stop-opacity="0.22" />
                  <stop offset="1" stop-color="var(--color-primary)" stop-opacity="0.01" />
                </linearGradient>
              </defs>
              <line v-for="y in [18, 70, 122]" :key="y" class="search-chart__grid" x1="0" :y1="y" x2="400" :y2="y" />
              <line v-for="x in [100, 200, 300]" :key="x" class="search-chart__grid" :x1="x" y1="0" :x2="x" y2="140" />
              <polygon :points="chartArea" fill="url(#search-perf-fill)" />
              <polyline class="search-chart__line" :points="chartLine" />
            </svg>
            <span
              v-for="point in chartMarkers"
              :key="point.day"
              class="search-chart__point"
              :style="{ left: `${(point.x / 400) * 100}%`, top: `${(point.y / 140) * 100}%` }"
              role="img"
              tabindex="0"
              :aria-label="point.label"
              :title="point.label"
            />
          </div>
          <footer>
            <span>{{ dayLabel(0) }}</span>
            <strong>{{ metric === 'clicks' ? 'Clicks per day' : 'Impressions per day' }}</strong>
            <span>{{ dayLabel(27) }}</span>
          </footer>
        </div>

        <table class="search-queries" aria-label="Top search queries">
          <thead>
            <tr><th>Top queries</th><th>Clicks</th><th>Impressions</th><th>CTR</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in perf.queries" :key="row.query">
              <td>{{ row.query }}</td>
              <td>{{ fmtCompact(row.clicks) }}</td>
              <td>{{ fmtCompact(row.impressions) }}</td>
              <td>{{ ((row.clicks / row.impressions) * 100).toFixed(1) }}%</td>
            </tr>
          </tbody>
        </table>
      </template>

      <div v-else class="workspace-empty">
        <AppEmptyState
          icon="travel_explore"
          title="No property connected"
          description="This site has no Search Console property yet."
        />
      </div>
    </AppCard>

    <AppDetailPanel
      v-model="detailOpen"
      eyebrow="Website"
      :title="mode === 'view' ? (selected?.name ?? 'Website') : 'New website'"
      :description="mode === 'view' ? (selected?.domain ?? '') : 'Register a site to track.'"
    >
      <div v-if="mode === 'view' && selected" class="website-detail">
        <h3 class="website-detail__heading">Technical</h3>
        <dl class="workspace-detail-stack">
          <div class="workspace-detail-row"><dt>Status</dt><dd>{{ selected.status }}</dd></div>
          <div class="workspace-detail-row"><dt>Framework</dt><dd>{{ selected.framework }}</dd></div>
          <div class="workspace-detail-row"><dt>Hosting</dt><dd>{{ selected.hosting }}</dd></div>
          <div class="workspace-detail-row"><dt>Repository</dt><dd class="website-detail__link">{{ selected.repositoryUrl || '—' }}</dd></div>
        </dl>
        <h3 class="website-detail__heading">Deployment</h3>
        <dl class="workspace-detail-stack">
          <div class="workspace-detail-row"><dt>Production</dt><dd class="website-detail__link">{{ selected.productionUrl || '—' }}</dd></div>
          <div class="workspace-detail-row"><dt>Staging</dt><dd class="website-detail__link">{{ selected.stagingUrl || '—' }}</dd></div>
          <div class="workspace-detail-row"><dt>Last deploy</dt><dd>{{ selected.lastDeployment }}</dd></div>
          <div class="workspace-detail-row"><dt>Open issues</dt><dd>{{ selected.openIssues }}</dd></div>
        </dl>
        <h3 class="website-detail__heading">Domain</h3>
        <dl class="workspace-detail-stack">
          <div class="workspace-detail-row"><dt>Domain</dt><dd>{{ selected.domain }}</dd></div>
          <div class="workspace-detail-row"><dt>Expiry</dt><dd>{{ selected.domainExpiry }}</dd></div>
          <div class="workspace-detail-row"><dt>SSL</dt><dd>{{ selected.ssl }}</dd></div>
        </dl>
        <h3 class="website-detail__heading">SEO</h3>
        <p class="website-detail__soft">
          <q-icon name="travel_explore" /> Search Console &amp; Analytics sync coming later — properties:
          {{ selected.searchConsoleProperty || 'none' }} / {{ selected.analyticsProperty || 'none' }}.
        </p>
        <h3 class="website-detail__heading">Maintenance</h3>
        <ul class="website-checklist">
          <li v-for="(item, i) in selected.maintenance" :key="i">
            <q-checkbox :model-value="item.done" :aria-label="`Toggle ${item.label}`" @update:model-value="item.done = !item.done" />
            <span :class="{ 'website-checklist--done': item.done }">{{ item.label }}</span>
          </li>
          <li v-if="!selected.maintenance.length" class="website-checklist__empty">No checklist items.</li>
        </ul>
      </div>
      <form v-else id="website-form" @submit.prevent="saveWebsite">
        <label class="workspace-field"><span class="workspace-field__label">Website name</span><q-input v-model="draft.name" outlined autofocus /></label>
        <label class="workspace-field"><span class="workspace-field__label">Domain</span><q-input v-model="draft.domain" outlined /></label>
        <label class="workspace-field"><span class="workspace-field__label">Framework</span><q-input v-model="draft.framework" outlined /></label>
        <label class="workspace-field"><span class="workspace-field__label">Hosting</span><q-input v-model="draft.hosting" outlined /></label>
        <label class="workspace-field"><span class="workspace-field__label">Status</span><q-select v-model="draft.status" outlined :options="websiteStatuses" /></label>
        <label class="workspace-field"><span class="workspace-field__label">Production URL</span><q-input v-model="draft.productionUrl" outlined type="url" /></label>
      </form>
      <template #actions>
        <AppButton v-if="mode === 'form'" type="submit" form="website-form" :disabled="!draft.name.trim()">Add website</AppButton>
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
import AppIconButton from '@/components/ui/AppIconButton.vue';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader.vue';
import { useMockLoad } from '@/composables/useMockLoad';
import { searchPerformance, websites as websitesMock, websiteStatuses } from '@/data/websites.mock';
import type { Website, WebsiteStatus } from '@/data/websites.mock';

type WebsiteTab = 'All websites' | 'Active' | 'Needs attention' | 'Archived';

const $q = useQuasar();
const { loading } = useMockLoad();
const tabs: WebsiteTab[] = ['All websites', 'Active', 'Needs attention', 'Archived'];
const activeTab = ref<WebsiteTab>('All websites');
const websites = ref<Website[]>(websitesMock.map((w) => ({ ...w, maintenance: w.maintenance.map((m) => ({ ...m })) })));
const detailOpen = ref(false);
const mode = ref<'view' | 'form'>('view');
const selected = ref<Website | null>(null);

const draft = reactive<{
  name: string;
  domain: string;
  framework: string;
  hosting: string;
  status: WebsiteStatus;
  productionUrl: string;
}>({
  name: '',
  domain: '',
  framework: '',
  hosting: '',
  status: 'In development',
  productionUrl: '',
});

function needsAttention(site: Website) {
  return site.openIssues > 0 || site.ssl === 'Expiring' || site.status === 'Maintenance' || site.status === 'Offline';
}

const visibleWebsites = computed(() =>
  websites.value.filter((w) => {
    if (activeTab.value === 'Active') return w.status === 'Online' || w.status === 'In development';
    if (activeTab.value === 'Needs attention') return needsAttention(w);
    if (activeTab.value === 'Archived') return w.status === 'Archived';
    return true;
  }),
);

const stats = computed(() => [
  { label: 'Total websites', value: websites.value.length, detail: 'Tracked' },
  { label: 'Online', value: websites.value.filter((w) => w.status === 'Online').length, detail: 'Live now' },
  { label: 'Needs attention', value: websites.value.filter(needsAttention).length, detail: 'Review' },
  { label: 'Domains expiring', value: websites.value.filter((w) => w.domainExpiry.includes('2026') || w.domainExpiry === 'Expired').length, detail: 'Soon' },
]);

function openWebsite(site: Website) {
  selected.value = site;
  mode.value = 'view';
  detailOpen.value = true;
}
function openCreate() {
  selected.value = null;
  Object.assign(draft, { name: '', domain: '', framework: '', hosting: '', status: 'In development', productionUrl: '' });
  mode.value = 'form';
  detailOpen.value = true;
}
function saveWebsite() {
  if (!draft.name.trim()) return;
  websites.value.unshift({
    id: Date.now(),
    name: draft.name.trim(),
    domain: draft.domain.trim() || 'example.com',
    description: '',
    status: draft.status,
    framework: draft.framework.trim() || 'Unknown',
    hosting: draft.hosting.trim() || 'Unknown',
    repositoryUrl: '',
    adminUrl: '',
    productionUrl: draft.productionUrl.trim(),
    stagingUrl: '',
    searchConsoleProperty: '',
    analyticsProperty: '',
    domainExpiry: 'Unknown',
    ssl: 'None',
    lastDeployment: 'Never',
    openIssues: 0,
    notes: '',
    maintenance: [],
  });
  detailOpen.value = false;
  $q.notify({ type: 'positive', message: 'Website added (mock — not saved yet)', timeout: 1600 });
}
function openUrl(url: string) {
  if (url) window.open(url, '_blank', 'noopener');
}

// --- Search performance (Search Console–style) ---
type SearchMetric = 'clicks' | 'impressions';

const propertySites = computed(() => websites.value.filter((w) => w.searchConsoleProperty));
const propertyOptions = computed(() =>
  propertySites.value.map((w) => ({ label: w.searchConsoleProperty, value: w.id })),
);
const propertyId = ref<number | null>(propertySites.value[0]?.id ?? null);
const metric = ref<SearchMetric>('clicks');
const selectedProperty = computed(
  () => propertySites.value.find((w) => w.id === propertyId.value) ?? null,
);
const perf = computed(() =>
  selectedProperty.value ? searchPerformance(selectedProperty.value) : null,
);

function fmtCompact(value: number) {
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
function dayLabel(dayIndex: number) {
  const date = new Date();
  date.setDate(date.getDate() - (27 - dayIndex));
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const metricTiles = computed(() => [
  { key: 'clicks' as const, label: 'Total clicks', value: fmtCompact(perf.value?.totalClicks ?? 0) },
  { key: 'impressions' as const, label: 'Total impressions', value: fmtCompact(perf.value?.totalImpressions ?? 0) },
]);
const staticTiles = computed(() => [
  { label: 'Average CTR', value: `${(perf.value?.avgCtr ?? 0).toFixed(1)}%` },
  { label: 'Average position', value: (perf.value?.avgPosition ?? 0).toFixed(1) },
]);

const chartMax = computed(() =>
  Math.max(1, ...(perf.value?.days.map((d) => d[metric.value]) ?? [1])),
);
const chartPoints = computed(() => {
  const days = perf.value?.days ?? [];
  return days.map((d, i) => ({
    day: d.day,
    x: days.length > 1 ? (i / (days.length - 1)) * 400 : 200,
    y: 130 - (d[metric.value] / chartMax.value) * 120,
    label: `${dayLabel(i)} · ${d[metric.value].toLocaleString()} ${metric.value}`,
  }));
});
const chartLine = computed(() => chartPoints.value.map((p) => `${p.x},${p.y}`).join(' '));
const chartArea = computed(() =>
  chartPoints.value.length ? `0,140 ${chartLine.value} 400,140` : '',
);
const chartMarkers = computed(() => chartPoints.value);
</script>

<style scoped lang="scss">
.websites-panel {
  display: flex;
  flex-direction: column;
}
.websites-pad {
  padding: var(--space-2);
}
.website-card__headline {
  display: flex;
  flex-direction: column;
  color: var(--color-text);
  text-align: left;
}
.website-card__headline small {
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.74rem;
}
.website-card__status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-control);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-secondary);
}
.website-card__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-text-muted);
}
.website-card__dot[data-status='Online'] {
  background: var(--brand-mint);
}
.website-card__dot[data-status='In development'] {
  background: var(--brand-teal);
}
.website-card__dot[data-status='Maintenance'],
.website-card__dot[data-status='Offline'] {
  background: var(--color-warning);
}
.website-card__actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-top: auto;
  padding-top: var(--space-1);
}
.website-card__actions :deep(.app-btn) {
  margin-left: auto;
}
.website-detail__heading {
  margin: var(--space-3) 0 var(--space-1);
  font-family: var(--font-heading);
  font-size: 0.92rem;
}
.website-detail__heading:first-child {
  margin-top: 0;
}
.website-detail__link {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8rem;
}
.website-detail__soft {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.76rem;
  line-height: 1.35;
}
.website-checklist {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  list-style: none;
}
.website-checklist li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.85rem;
}
.website-checklist--done {
  opacity: 0.55;
  text-decoration: line-through;
}
.website-checklist__empty {
  color: var(--color-text-muted);
  font-style: italic;
}

/* --- Search performance (Search Console–style) --- */
.search-panel__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}
.search-panel__header h2 {
  font-size: 1.3rem;
  font-weight: 700;
}
.search-panel__property {
  min-width: 220px;
  font-family: var(--font-control);
}
.search-tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}
.search-tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-raised);
  text-align: left;
  transition:
    background-color 150ms ease,
    border-color 150ms ease;
}
.search-tile span {
  color: var(--color-text-secondary);
  font-family: var(--font-control);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.search-tile strong {
  font-family: var(--font-heading);
  font-size: 1.45rem;
  font-variant-numeric: tabular-nums;
}
button.search-tile {
  cursor: pointer;
}
button.search-tile:hover {
  border-color: var(--color-primary);
}
.search-tile--active {
  border-color: var(--color-primary);
  background: var(--color-strong-surface);
}
.search-tile--active span,
.search-tile--active strong {
  color: var(--color-on-strong-surface);
}
.search-tile:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
.search-chart__plot {
  position: relative;
}
.search-chart svg {
  display: block;
  width: 100%;
  height: 170px;
}
.search-chart__grid {
  stroke: var(--color-border);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.search-chart__line {
  fill: none;
  stroke: var(--color-primary);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}
.search-chart__scale {
  position: absolute;
  left: 4px;
  z-index: 1;
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.66rem;
}
.search-chart__scale--top {
  top: 2px;
}
.search-chart__scale--bottom {
  bottom: 2px;
}
.search-chart__point {
  position: absolute;
  width: 9px;
  height: 9px;
  border: 2px solid var(--color-surface);
  border-radius: 50%;
  background: var(--color-primary);
  transform: translate(-50%, -50%);
  cursor: pointer;
}
.search-chart__point:hover,
.search-chart__point:focus-visible {
  width: 13px;
  height: 13px;
  outline: none;
}
.search-chart footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.7rem;
}
.search-queries {
  width: 100%;
  margin-top: var(--space-3);
  border-collapse: collapse;
  font-size: 0.85rem;
}
.search-queries th {
  padding: var(--space-1) var(--space-2);
  border-bottom: 1px solid var(--color-border-strong);
  color: var(--color-text-secondary);
  font-family: var(--font-control);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-align: right;
  text-transform: uppercase;
}
.search-queries td {
  padding: var(--space-1) var(--space-2);
  border-bottom: 1px solid var(--color-border);
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.search-queries th:first-child,
.search-queries td:first-child {
  text-align: left;
}
.search-queries tbody tr:hover {
  background: var(--color-surface-soft);
}
@media (max-width: 767px) {
  .search-panel__header {
    align-items: stretch;
    flex-direction: column;
  }
  .search-tiles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
