<template>
  <main class="gsc-page">
    <header class="gsc-topbar">
      <div class="gsc-brand">
        <span class="gsc-brand__mark"><q-icon name="travel_explore" /></span>
        <span>Search Console</span>
      </div>

      <label class="gsc-property">
        <q-icon name="language" aria-hidden="true" />
        <select v-model.number="propertyId" aria-label="Search Console property">
          <option v-for="property in propertyOptions" :key="property.value" :value="property.value">{{ property.label }}</option>
        </select>
        <q-icon name="arrow_drop_down" aria-hidden="true" />
      </label>

      <form class="gsc-url-search" role="search" @submit.prevent="inspectUrl">
        <q-icon name="search" aria-hidden="true" />
        <input
          v-model="inspectionUrl"
          type="url"
          :placeholder="`Inspect any URL in ${selectedProperty?.domain ?? 'this property'}`"
          aria-label="Inspect a URL"
        />
      </form>

      <div class="gsc-topbar__actions">
        <q-btn flat round dense icon="help_outline" aria-label="Help"><q-tooltip>Help</q-tooltip></q-btn>
        <q-btn flat round dense icon="notifications_none" aria-label="Notifications"><q-tooltip>Notifications</q-tooltip></q-btn>
        <q-btn flat round dense icon="apps" aria-label="Google apps"><q-tooltip>Apps</q-tooltip></q-btn>
      </div>
    </header>

    <div class="gsc-workspace">
      <aside class="gsc-sidebar" aria-label="Search Console navigation">
        <button
          v-for="item in navigation"
          :key="item.id"
          type="button"
          class="gsc-nav-item"
          :class="{ 'gsc-nav-item--active': activeView === item.id }"
          :aria-current="activeView === item.id ? 'page' : undefined"
          @click="activeView = item.id"
        >
          <q-icon :name="item.icon" />
          <span>{{ item.label }}</span>
        </button>
        <template v-for="group in navigationGroups" :key="group.label">
          <p class="gsc-nav-label">{{ group.label }}</p>
          <button
            v-for="item in group.items"
            :key="item.id"
            type="button"
            class="gsc-nav-item"
            :class="{ 'gsc-nav-item--active': activeView === item.id }"
            :aria-current="activeView === item.id ? 'page' : undefined"
            @click="activeView = item.id"
          >
            <q-icon :name="item.icon" />
            <span>{{ item.label }}</span>
          </button>
        </template>
      </aside>

      <section class="gsc-content">
        <div v-if="loading" class="gsc-loading" aria-busy="true">
          <AppSkeleton variant="card" height="110px" />
          <AppSkeleton variant="card" height="320px" />
        </div>

        <template v-else-if="perf && selectedProperty">
          <header class="gsc-page-heading">
            <div>
              <p>{{ selectedProperty.domain }}</p>
              <h1>{{ activeTitle }}</h1>
            </div>
            <button v-if="activeView === 'overview'" type="button" class="gsc-primary-button" @click="activeView = 'performance'">
              <q-icon name="insights" /> Full report
            </button>
          </header>

          <template v-if="activeView === 'overview'">
            <section class="gsc-card gsc-welcome">
              <span class="gsc-welcome__icon"><q-icon name="auto_awesome" /></span>
              <div>
                <h2>Your site at a glance</h2>
                <p>Monitor search traffic, indexing, page experience, and issues for {{ selectedProperty.domain }}.</p>
              </div>
              <button type="button" aria-label="Dismiss welcome card"><q-icon name="close" /></button>
            </section>

            <section class="gsc-card gsc-overview-card">
              <header><div><span>Performance</span><h2>{{ fmtCompact(perf.totalClicks) }} total web search clicks</h2></div><button type="button" @click="activeView = 'performance'">Full report <q-icon name="arrow_forward" /></button></header>
              <div class="gsc-mini-chart">
                <svg viewBox="0 0 800 130" preserveAspectRatio="none" role="img" aria-label="Search clicks over the last 28 days">
                  <line v-for="y in [20, 65, 110]" :key="y" x1="0" :y1="y" x2="800" :y2="y" />
                  <polyline :points="overviewChartLine" />
                </svg>
              </div>
            </section>

            <div class="gsc-overview-grid">
              <section class="gsc-card gsc-summary-card">
                <header><span>Indexing</span><button type="button" @click="activeView = 'pages'">Full report <q-icon name="arrow_forward" /></button></header>
                <h2>Pages</h2>
                <div class="gsc-index-summary">
                  <div><strong>12</strong><span>Not indexed</span></div>
                  <div><strong>64</strong><span>Indexed</span></div>
                </div>
                <div class="gsc-bar"><span style="width: 84%" /></div>
                <p><q-icon name="check_circle" /> Data collected successfully</p>
              </section>

              <section class="gsc-card gsc-summary-card">
                <header><span>Experience</span><button type="button" @click="activeView = 'page-experience'">Full report <q-icon name="arrow_forward" /></button></header>
                <h2>Page experience</h2>
                <dl class="gsc-status-list">
                  <div><dt>Core Web Vitals</dt><dd class="gsc-status-good"><q-icon name="check_circle" /> 58 good URLs</dd></div>
                  <div><dt>HTTPS</dt><dd class="gsc-status-good"><q-icon name="check_circle" /> 64 HTTPS URLs</dd></div>
                </dl>
              </section>
            </div>

            <section class="gsc-card gsc-summary-card">
              <header><span>Enhancements</span></header>
              <button type="button" class="gsc-report-row" @click="activeView = 'breadcrumbs'">
                <q-icon name="account_tree" /><span><strong>Breadcrumbs</strong><small>42 valid items · 0 invalid</small></span><q-icon name="chevron_right" />
              </button>
            </section>
          </template>

          <template v-else-if="activeView === 'performance'">
            <div class="gsc-filter-row">
              <button v-for="range in dateRanges" :key="range" type="button" :class="{ active: dateRange === range }" @click="dateRange = range">
                <q-icon v-if="dateRange === range" name="check" />{{ range }}
              </button>
              <button type="button">Search type: Web <q-icon name="expand_more" /></button>
              <button type="button"><q-icon name="add" /> New</button>
              <span>Last updated: 3 hours ago</span>
            </div>

            <section class="gsc-card gsc-performance-card">
              <div class="gsc-metrics">
                <button
                  v-for="tile in metricTiles"
                  :key="tile.key"
                  type="button"
                  :class="[`gsc-metric--${tile.key}`, { active: selectedMetrics.includes(tile.key) }]"
                  :aria-pressed="selectedMetrics.includes(tile.key)"
                  @click="toggleMetric(tile.key)"
                >
                  <span><q-icon :name="selectedMetrics.includes(tile.key) ? 'check_box' : 'check_box_outline_blank'" /> {{ tile.label }}</span>
                  <strong>{{ tile.value }}</strong>
                  <small>{{ tile.note }}</small>
                </button>
              </div>

              <div class="gsc-chart">
                <svg viewBox="0 0 800 250" preserveAspectRatio="none" role="img" aria-label="Search performance over the last 28 days">
                  <line v-for="y in [25, 85, 145, 205]" :key="y" x1="0" :y1="y" x2="800" :y2="y" />
                  <polyline v-if="selectedMetrics.includes('clicks')" class="gsc-chart__clicks" :points="clickChartLine" />
                  <polyline v-if="selectedMetrics.includes('impressions')" class="gsc-chart__impressions" :points="impressionChartLine" />
                </svg>
                <footer><span>{{ dayLabel(0) }}</span><span>{{ dayLabel(9) }}</span><span>{{ dayLabel(18) }}</span><span>{{ dayLabel(27) }}</span></footer>
              </div>

              <div class="gsc-table-tabs" role="tablist" aria-label="Performance dimensions">
                <button v-for="tab in reportTabs" :key="tab" type="button" role="tab" :aria-selected="reportTab === tab" :class="{ active: reportTab === tab }" @click="reportTab = tab">{{ tab }}</button>
                <q-btn flat round dense icon="filter_list" aria-label="Filter table" />
              </div>
              <div class="gsc-table-wrap">
                <table class="gsc-table">
                  <thead><tr><th>{{ reportTab }}</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th></tr></thead>
                  <tbody><tr v-for="row in reportRows" :key="row.label"><td>{{ row.label }}</td><td>{{ row.clicks }}</td><td>{{ row.impressions }}</td><td>{{ row.ctr }}</td><td>{{ row.position }}</td></tr></tbody>
                </table>
              </div>
            </section>
          </template>

          <template v-else-if="activeView === 'inspection'">
            <section class="gsc-card gsc-inspection-search">
              <form @submit.prevent="inspectUrl"><q-icon name="search" /><input v-model="inspectionUrl" type="url" placeholder="Enter a full URL to inspect" required /><button type="submit">Inspect</button></form>
            </section>
            <section v-if="inspectedUrl" class="gsc-card gsc-inspection-result">
              <header><span class="gsc-success-icon"><q-icon name="check" /></span><div><h2>URL is on Google</h2><p>It can appear in Google Search results with all relevant enhancements.</p></div></header>
              <div class="gsc-inspection-actions"><button type="button" class="gsc-text-button" @click="notify('Live test started')">Test live URL</button><button type="button" class="gsc-primary-button" @click="notify('Indexing requested')">Request indexing</button></div>
              <p class="gsc-inspected-url">{{ inspectedUrl }}</p>
              <dl class="gsc-detail-list">
                <div><dt><q-icon name="check_circle" /> Page indexing</dt><dd>Page is indexed</dd></div>
                <div><dt><q-icon name="check_circle" /> HTTPS</dt><dd>Page is served over HTTPS</dd></div>
                <div><dt><q-icon name="check_circle" /> Breadcrumbs</dt><dd>1 valid item detected</dd></div>
              </dl>
            </section>
          </template>

          <template v-else-if="activeView === 'pages'">
            <ReportSummary title="Page indexing" description="See which pages Google can find and index." :good="64" :warning="12" good-label="Indexed" warning-label="Not indexed" />
            <section class="gsc-card gsc-report-card">
              <header><div><p>Why pages aren't indexed</p><h2>12 affected pages</h2></div><q-icon name="filter_list" /></header>
              <table class="gsc-table"><thead><tr><th>Reason</th><th>Source</th><th>Validation</th><th>Pages</th></tr></thead><tbody><tr v-for="row in indexingRows" :key="row.reason"><td>{{ row.reason }}</td><td>Website</td><td><span class="gsc-validation" :class="row.tone">{{ row.validation }}</span></td><td>{{ row.pages }}</td></tr></tbody></table>
            </section>
          </template>

          <template v-else-if="activeView === 'videos'">
            <EmptyReport icon="video_library" title="No video pages detected" description="Google hasn't detected any indexed pages with video content on this property." />
          </template>

          <template v-else-if="activeView === 'sitemaps'">
            <section class="gsc-card gsc-form-card"><h2>Add a new sitemap</h2><form @submit.prevent="addSitemap"><span>{{ selectedProperty.productionUrl }}/</span><input v-model="newSitemap" required placeholder="sitemap.xml" /><button type="submit">Submit</button></form></section>
            <section class="gsc-card gsc-report-card"><header><div><p>Submitted sitemaps</p><h2>{{ sitemaps.length }} sitemaps</h2></div></header><table class="gsc-table"><thead><tr><th>Sitemap</th><th>Type</th><th>Submitted</th><th>Status</th><th>Discovered pages</th></tr></thead><tbody><tr v-for="row in sitemaps" :key="row.path"><td>{{ row.path }}</td><td>Sitemap</td><td>{{ row.submitted }}</td><td class="gsc-status-good">Success</td><td>{{ row.pages }}</td></tr></tbody></table></section>
          </template>

          <template v-else-if="activeView === 'removals'">
            <section class="gsc-card gsc-report-card"><header><div><p>Temporary removals</p><h2>Remove URLs from Google Search for about six months</h2></div><button class="gsc-primary-button" type="button" @click="notify('New removal request opened')">New request</button></header><div class="gsc-empty-inline"><q-icon name="hide_source" /><p>No removal requests</p><span>URLs you request to remove will appear here.</span></div></section>
          </template>

          <template v-else-if="activeView === 'page-experience'">
            <section class="gsc-card gsc-experience-intro"><q-icon name="speed" /><div><h2>Page experience</h2><p>Understand how visitors experience your site on mobile and desktop.</p></div></section>
            <div class="gsc-overview-grid"><ExperienceCard device="Mobile" icon="smartphone" good="58" /><ExperienceCard device="Desktop" icon="desktop_windows" good="62" /></div>
          </template>

          <template v-else-if="activeView === 'core-web-vitals'">
            <ReportSummary title="Core Web Vitals: Mobile" description="Based on real-world usage data from the last 90 days." :good="58" :warning="4" :poor="2" good-label="Good URLs" warning-label="Need improvement" poor-label="Poor" />
            <ReportSummary title="Core Web Vitals: Desktop" description="Based on real-world usage data from the last 90 days." :good="62" :warning="2" :poor="0" good-label="Good URLs" warning-label="Need improvement" poor-label="Poor" />
          </template>

          <template v-else-if="activeView === 'https'">
            <ReportSummary title="HTTPS" description="HTTPS protects your users and is required for a good page experience." :good="64" :warning="0" good-label="HTTPS URLs" warning-label="Non-HTTPS URLs" />
            <section class="gsc-card gsc-callout-good"><q-icon name="verified_user" /><div><h2>All pages are served over HTTPS</h2><p>No HTTPS issues were detected.</p></div></section>
          </template>

          <template v-else-if="activeView === 'breadcrumbs'">
            <ReportSummary title="Breadcrumbs" description="Valid structured data can appear as rich results in Google Search." :good="42" :warning="0" good-label="Valid items" warning-label="Invalid items" />
            <section class="gsc-card gsc-report-card"><header><div><p>Why items are invalid</p><h2>No issues detected</h2></div></header><div class="gsc-empty-inline"><q-icon name="task_alt" /><p>Looking good</p><span>Google found no breadcrumb errors.</span></div></section>
          </template>

          <template v-else-if="activeView === 'manual-actions' || activeView === 'security'">
            <EmptyReport :icon="activeView === 'security' ? 'security' : 'gavel'" :title="activeView === 'security' ? 'No security issues detected' : 'No manual actions detected'" description="No issues currently prevent your site from appearing in Google Search." success />
          </template>

          <template v-else-if="activeView === 'links'">
            <div class="gsc-links-grid"><LinkTable title="Top linked pages — externally" :rows="externalLinks" /><LinkTable title="Top linked pages — internally" :rows="internalLinks" /><LinkTable title="Top linking sites" :rows="linkingSites" /><LinkTable title="Top linking text" :rows="linkingText" /></div>
          </template>

          <template v-else-if="activeView === 'settings'">
            <section class="gsc-card gsc-settings-card"><h2>Property settings</h2><button v-for="row in settingsRows" :key="row.label" type="button" @click="notify(`${row.label} opened`)"><q-icon :name="row.icon" /><span><strong>{{ row.label }}</strong><small>{{ row.detail }}</small></span><q-icon name="chevron_right" /></button></section>
          </template>
        </template>

        <EmptyReport v-else icon="travel_explore" title="No property connected" description="Add a Search Console property to start monitoring search performance." />
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue';
import { QIcon, useQuasar } from 'quasar';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import { useMockLoad } from '@/composables/useMockLoad';
import { searchPerformance, websites } from '@/data/websites.mock';

type ViewId =
  | 'overview' | 'performance' | 'inspection' | 'pages' | 'videos' | 'sitemaps' | 'removals'
  | 'page-experience' | 'core-web-vitals' | 'https' | 'breadcrumbs' | 'manual-actions'
  | 'security' | 'links' | 'settings';
type MetricKey = 'clicks' | 'impressions' | 'ctr' | 'position';
interface NavItem { id: ViewId; label: string; icon: string }

const $q = useQuasar();
const { loading } = useMockLoad(250);
const propertySites = computed(() => websites.filter((site) => site.searchConsoleProperty));
const propertyOptions = computed(() => propertySites.value.map((site) => ({ label: site.searchConsoleProperty, value: site.id })));
const propertyId = ref(propertySites.value[0]?.id ?? null);
const selectedProperty = computed(() => propertySites.value.find((site) => site.id === propertyId.value) ?? null);
const perf = computed(() => selectedProperty.value ? searchPerformance(selectedProperty.value) : null);
const activeView = ref<ViewId>('overview');

const navigation: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'performance', label: 'Performance', icon: 'insights' },
  { id: 'inspection', label: 'URL inspection', icon: 'search' },
];
const navigationGroups: { label: string; items: NavItem[] }[] = [
  { label: 'Indexing', items: [
    { id: 'pages', label: 'Pages', icon: 'description' },
    { id: 'videos', label: 'Video pages', icon: 'video_library' },
    { id: 'sitemaps', label: 'Sitemaps', icon: 'account_tree' },
    { id: 'removals', label: 'Removals', icon: 'hide_source' },
  ] },
  { label: 'Experience', items: [
    { id: 'page-experience', label: 'Page experience', icon: 'speed' },
    { id: 'core-web-vitals', label: 'Core Web Vitals', icon: 'monitor_heart' },
    { id: 'https', label: 'HTTPS', icon: 'lock' },
  ] },
  { label: 'Enhancements', items: [{ id: 'breadcrumbs', label: 'Breadcrumbs', icon: 'account_tree' }] },
  { label: 'Security & Manual Actions', items: [
    { id: 'manual-actions', label: 'Manual actions', icon: 'gavel' },
    { id: 'security', label: 'Security issues', icon: 'security' },
  ] },
  { label: '', items: [
    { id: 'links', label: 'Links', icon: 'link' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ] },
];
const allNavigation = [...navigation, ...navigationGroups.flatMap((group) => group.items)];
const activeTitle = computed(() => allNavigation.find((item) => item.id === activeView.value)?.label ?? 'Search Console');

function fmtCompact(value: number) {
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
function dayLabel(dayIndex: number) {
  const date = new Date();
  date.setDate(date.getDate() - (27 - dayIndex));
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function linePoints(key: 'clicks' | 'impressions', width: number, height: number) {
  const days = perf.value?.days ?? [];
  const max = Math.max(1, ...days.map((day) => day[key]));
  return days.map((day, index) => `${(index / Math.max(1, days.length - 1)) * width},${height - 12 - (day[key] / max) * (height - 28)}`).join(' ');
}
const overviewChartLine = computed(() => linePoints('clicks', 800, 130));
const clickChartLine = computed(() => linePoints('clicks', 800, 250));
const impressionChartLine = computed(() => linePoints('impressions', 800, 250));

const selectedMetrics = ref<MetricKey[]>(['clicks', 'impressions']);
const metricTiles = computed(() => [
  { key: 'clicks' as const, label: 'Total clicks', value: fmtCompact(perf.value?.totalClicks ?? 0), note: 'Web search' },
  { key: 'impressions' as const, label: 'Total impressions', value: fmtCompact(perf.value?.totalImpressions ?? 0), note: 'Web search' },
  { key: 'ctr' as const, label: 'Average CTR', value: `${(perf.value?.avgCtr ?? 0).toFixed(1)}%`, note: 'Click-through rate' },
  { key: 'position' as const, label: 'Average position', value: (perf.value?.avgPosition ?? 0).toFixed(1), note: 'Across all queries' },
]);
function toggleMetric(metric: MetricKey) {
  selectedMetrics.value = selectedMetrics.value.includes(metric)
    ? selectedMetrics.value.filter((item) => item !== metric)
    : [...selectedMetrics.value, metric];
}

const dateRanges = ['24 hours', '7 days', '28 days', '3 months'];
const dateRange = ref('28 days');
const reportTabs = ['Queries', 'Pages', 'Countries', 'Devices', 'Search appearance', 'Dates'];
const reportTab = ref('Queries');
const staticReportRows = {
  Pages: ['/','/projects','/about','/notes','/contact'],
  Countries: ['Cambodia','United States','Singapore','United Kingdom','Australia'],
  Devices: ['Mobile','Desktop','Tablet'],
  'Search appearance': ['Web results','Rich results','Images','Videos'],
};
const reportRows = computed(() => {
  if (!perf.value) return [];
  if (reportTab.value === 'Queries') return perf.value.queries.map((row, index) => ({ label: row.query, clicks: fmtCompact(row.clicks), impressions: fmtCompact(row.impressions), ctr: `${((row.clicks / row.impressions) * 100).toFixed(1)}%`, position: (5.2 + index * 1.7).toFixed(1) }));
  if (reportTab.value === 'Dates') return perf.value.days.slice(-7).reverse().map((row) => ({ label: dayLabel(row.day), clicks: row.clicks, impressions: fmtCompact(row.impressions), ctr: `${((row.clicks / row.impressions) * 100).toFixed(1)}%`, position: (7 + row.day / 10).toFixed(1) }));
  const labels = staticReportRows[reportTab.value as keyof typeof staticReportRows] ?? [];
  return labels.map((label, index) => ({ label, clicks: fmtCompact(Math.round(perf.value!.totalClicks / (index + 2))), impressions: fmtCompact(Math.round(perf.value!.totalImpressions / (index + 2))), ctr: `${Math.max(1.5, perf.value!.avgCtr - index * 0.4).toFixed(1)}%`, position: (perf.value!.avgPosition + index * 0.8).toFixed(1) }));
});

const inspectionUrl = ref('');
const inspectedUrl = ref('');
function inspectUrl() {
  inspectedUrl.value = inspectionUrl.value.trim() || selectedProperty.value?.productionUrl || '';
  activeView.value = 'inspection';
}
function notify(message: string) {
  $q.notify({ message, color: 'primary', timeout: 1400 });
}

const indexingRows = [
  { reason: 'Crawled — currently not indexed', validation: 'Started', pages: 6, tone: 'warning' },
  { reason: 'Page with redirect', validation: 'Not started', pages: 3, tone: '' },
  { reason: 'Duplicate without user-selected canonical', validation: 'Started', pages: 2, tone: 'warning' },
  { reason: 'Not found (404)', validation: 'Passed', pages: 1, tone: 'good' },
];
const sitemaps = ref([{ path: 'sitemap.xml', submitted: 'Jul 12, 2026', pages: 64 }]);
const newSitemap = ref('');
function addSitemap() {
  sitemaps.value.unshift({ path: newSitemap.value.trim(), submitted: 'Today', pages: 0 });
  newSitemap.value = '';
  notify('Sitemap submitted');
}
const externalLinks = [{ label: '/projects', value: 86 }, { label: '/', value: 42 }, { label: '/about', value: 19 }];
const internalLinks = [{ label: '/', value: 124 }, { label: '/projects', value: 78 }, { label: '/notes', value: 51 }];
const linkingSites = [{ label: 'github.com', value: 28 }, { label: 'linkedin.com', value: 14 }, { label: 'dev.to', value: 9 }];
const linkingText = [{ label: 'Haruki', value: 32 }, { label: 'portfolio', value: 21 }, { label: 'haruki.dev', value: 13 }];
const settingsRows = [
  { label: 'Ownership verification', detail: 'You are a verified owner', icon: 'verified_user' },
  { label: 'Users and permissions', detail: '1 user', icon: 'group' },
  { label: 'Associations', detail: 'Google Analytics connected', icon: 'hub' },
  { label: 'Change of address', detail: 'Tell Google when your site moves', icon: 'moving' },
  { label: 'Crawl stats', detail: '1.2K crawl requests in the last 90 days', icon: 'query_stats' },
  { label: 'Remove property', detail: 'Remove this property from your account', icon: 'delete_outline' },
];

const ReportSummary = defineComponent({
  props: { title: String, description: String, good: Number, warning: Number, poor: Number, goodLabel: String, warningLabel: String, poorLabel: String },
  setup(props) {
    return () => h('section', { class: 'gsc-card gsc-report-summary' }, [
      h('div', [h('h2', props.title), h('p', props.description)]),
      h('div', { class: 'gsc-report-summary__stats' }, [
        h('div', { class: 'good' }, [h('strong', String(props.good ?? 0)), h('span', props.goodLabel)]),
        h('div', { class: 'warning' }, [h('strong', String(props.warning ?? 0)), h('span', props.warningLabel)]),
        props.poor !== undefined ? h('div', { class: 'poor' }, [h('strong', String(props.poor)), h('span', props.poorLabel)]) : null,
      ]),
      h('div', { class: 'gsc-report-bar' }, [h('span', { class: 'good', style: `flex:${props.good ?? 0}` }), h('span', { class: 'warning', style: `flex:${props.warning || 0.01}` }), props.poor !== undefined ? h('span', { class: 'poor', style: `flex:${props.poor || 0.01}` }) : null]),
    ]);
  },
});
const EmptyReport = defineComponent({
  props: { icon: String, title: String, description: String, success: Boolean },
  setup(props) {
    return () => h('section', { class: 'gsc-card gsc-empty-report' }, [h('span', { class: { 'gsc-empty-report__icon': true, success: props.success } }, [h(QIcon, { name: props.icon })]), h('h2', props.title), h('p', props.description)]);
  },
});
const ExperienceCard = defineComponent({
  props: { device: String, icon: String, good: String },
  setup(props) {
    return () => h('section', { class: 'gsc-card gsc-experience-card' }, [
      h('header', [h(QIcon, { name: props.icon }), h('h2', props.device)]),
      h('div', [h('span', 'Good URLs'), h('strong', props.good), h('small', '90%')]),
      h('p', [h(QIcon, { name: 'check_circle' }), ' Core Web Vitals passed']),
      h('p', [h(QIcon, { name: 'check_circle' }), ' HTTPS enabled']),
    ]);
  },
});
const LinkTable = defineComponent({
  props: { title: String, rows: { type: Array as () => { label: string; value: number }[], default: () => [] } },
  setup(props) {
    return () => h('section', { class: 'gsc-card gsc-link-card' }, [h('header', [h('h2', props.title), h('button', 'More')]), h('table', { class: 'gsc-table' }, [h('tbody', props.rows.map((row) => h('tr', [h('td', row.label), h('td', row.value)])))])]);
  },
});
</script>

<style scoped lang="scss">
.gsc-page {
  --gsc-blue: #1a73e8;
  --gsc-blue-soft: #e8f0fe;
  --gsc-purple: #673ab7;
  --gsc-green: #188038;
  --gsc-yellow: #f9ab00;
  --gsc-red: #d93025;
  --gsc-text: #202124;
  --gsc-muted: #5f6368;
  --gsc-border: #dadce0;
  --gsc-surface: #fff;
  --gsc-bg: #f8fafd;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--gsc-border);
  border-radius: 16px;
  color: var(--gsc-text);
  background: var(--gsc-bg);
  font-family: Arial, Helvetica, sans-serif;
}
.gsc-page :deep(.q-field__native),
.gsc-page :deep(.q-field__input),
.gsc-page :deep(.q-field__label) { font-family: Arial, Helvetica, sans-serif; }
.gsc-topbar { display: grid; grid-template-columns: 210px 240px minmax(280px, 680px) 1fr; align-items: center; gap: 12px; height: 64px; padding: 0 16px; border-bottom: 1px solid var(--gsc-border); background: var(--gsc-surface); }
.gsc-brand { display: flex; align-items: center; gap: 10px; color: var(--gsc-muted); font-size: 20px; white-space: nowrap; }
.gsc-brand__mark { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 50%; color: #fff; background: var(--gsc-blue); font-size: 21px; }
.gsc-property { display: flex; min-width: 0; height: 42px; align-items: center; gap: 8px; padding: 0 10px; border: 1px solid var(--gsc-border); border-radius: 4px; color: var(--gsc-muted); }
.gsc-property select { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; appearance: none; color: var(--gsc-text); background: transparent; font-size: 13px; }
.gsc-url-search { display: flex; align-items: center; gap: 12px; height: 46px; padding: 0 16px; border-radius: 8px; color: var(--gsc-muted); background: #eef3f8; }
.gsc-url-search input { width: 100%; border: 0; outline: 0; color: var(--gsc-text); background: transparent; font-size: 14px; }
.gsc-topbar__actions { display: flex; justify-content: flex-end; color: var(--gsc-muted); }
.gsc-workspace { display: grid; grid-template-columns: 244px minmax(0, 1fr); height: calc(100% - 64px); min-height: 0; }
.gsc-sidebar { padding: 12px 8px 32px 0; overflow-y: auto; border-right: 1px solid var(--gsc-border); background: var(--gsc-surface); }
.gsc-nav-label { padding: 18px 24px 5px; color: var(--gsc-muted); font-size: 12px; font-weight: 600; }
.gsc-nav-label:empty { height: 12px; padding: 0; border-top: 1px solid var(--gsc-border); margin: 10px 16px; }
.gsc-nav-item { display: flex; width: 100%; height: 42px; align-items: center; gap: 18px; padding: 0 24px; border-radius: 0 22px 22px 0; color: var(--gsc-muted); text-align: left; }
.gsc-nav-item .q-icon { font-size: 20px; }
.gsc-nav-item:hover { background: #f1f3f4; }
.gsc-nav-item--active { color: #174ea6; background: var(--gsc-blue-soft); font-weight: 600; }
.gsc-content { min-width: 0; overflow-y: auto; padding: 28px clamp(18px, 3vw, 48px) 60px; }
.gsc-content > * { width: min(100%, 1120px); margin-inline: auto; }
.gsc-loading { display: grid; gap: 20px; }
.gsc-page-heading { display: flex; align-items: center; justify-content: space-between; min-height: 58px; margin-bottom: 22px; }
.gsc-page-heading p { color: var(--gsc-muted); font-size: 12px; }
.gsc-page-heading h1 { font-family: inherit; font-size: 24px; font-weight: 400; line-height: 1.35; }
.gsc-card { margin-bottom: 20px; overflow: hidden; border: 1px solid var(--gsc-border); border-radius: 8px; background: var(--gsc-surface); box-shadow: 0 1px 2px rgb(60 64 67 / 8%); }
.gsc-card h2 { font-family: inherit; font-size: 18px; font-weight: 400; }
.gsc-primary-button, .gsc-text-button { min-height: 36px; padding: 0 18px; border-radius: 4px; color: var(--gsc-blue); font-weight: 600; }
.gsc-primary-button { display: inline-flex; align-items: center; gap: 8px; color: #fff; background: var(--gsc-blue); }
.gsc-primary-button:hover { background: #1765cc; }
.gsc-text-button:hover { background: var(--gsc-blue-soft); }
.gsc-welcome { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 20px; padding: 20px 24px; border-color: #c6dafc; background: #f4f8ff; }
.gsc-welcome__icon { display: grid; width: 44px; height: 44px; place-items: center; border-radius: 50%; color: var(--gsc-blue); background: var(--gsc-blue-soft); font-size: 23px; }
.gsc-welcome h2 { margin-bottom: 4px; }
.gsc-welcome p, .gsc-report-summary p, .gsc-empty-report p, .gsc-experience-intro p { color: var(--gsc-muted); font-size: 13px; }
.gsc-overview-card > header, .gsc-summary-card > header, .gsc-report-card > header { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 20px 24px 0; }
.gsc-overview-card header span, .gsc-summary-card header > span, .gsc-report-card header p { color: var(--gsc-muted); font-size: 13px; }
.gsc-overview-card header button, .gsc-summary-card header button { display: flex; align-items: center; gap: 6px; color: var(--gsc-blue); font-size: 12px; font-weight: 600; text-transform: uppercase; }
.gsc-mini-chart { padding: 10px 24px 20px; }
.gsc-mini-chart svg { width: 100%; height: 130px; overflow: visible; }
.gsc-mini-chart line, .gsc-chart line { stroke: #e8eaed; stroke-width: 1; vector-effect: non-scaling-stroke; }
.gsc-mini-chart polyline { fill: none; stroke: var(--gsc-blue); stroke-width: 2.2; vector-effect: non-scaling-stroke; }
.gsc-overview-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.gsc-summary-card { min-height: 240px; }
.gsc-summary-card h2 { padding: 12px 24px 0; }
.gsc-index-summary { display: flex; gap: 50px; padding: 18px 24px 10px; }
.gsc-index-summary div { display: flex; flex-direction: column; }
.gsc-index-summary strong { font-size: 26px; font-weight: 400; }
.gsc-index-summary span { color: var(--gsc-muted); font-size: 12px; }
.gsc-bar { height: 8px; margin: 4px 24px 18px; border-radius: 8px; background: #e8eaed; }
.gsc-bar span { display: block; height: 100%; border-radius: inherit; background: var(--gsc-green); }
.gsc-summary-card > p { display: flex; align-items: center; gap: 6px; padding: 0 24px; color: var(--gsc-green); font-size: 12px; }
.gsc-status-list { padding: 10px 24px; }
.gsc-status-list div { display: flex; justify-content: space-between; padding: 13px 0; border-bottom: 1px solid #eee; font-size: 13px; }
.gsc-status-good { color: var(--gsc-green); font-weight: 600; }
.gsc-report-row { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 16px; width: 100%; padding: 18px 24px; text-align: left; }
.gsc-report-row > .q-icon:first-child { color: var(--gsc-blue); font-size: 24px; }
.gsc-report-row span { display: flex; flex-direction: column; }
.gsc-report-row small { color: var(--gsc-muted); }
.gsc-filter-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 14px; }
.gsc-filter-row button { display: flex; min-height: 36px; align-items: center; gap: 5px; padding: 0 14px; border: 1px solid var(--gsc-border); border-radius: 4px; color: var(--gsc-muted); background: var(--gsc-surface); font-size: 13px; }
.gsc-filter-row button.active { border-color: var(--gsc-blue); color: var(--gsc-blue); background: var(--gsc-blue-soft); }
.gsc-filter-row > span { margin-left: auto; color: var(--gsc-muted); font-size: 12px; }
.gsc-performance-card { overflow: visible; }
.gsc-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); overflow: hidden; border-radius: 8px 8px 0 0; }
.gsc-metrics button { display: flex; min-height: 126px; flex-direction: column; gap: 6px; padding: 18px; color: var(--gsc-muted); background: #fff; text-align: left; }
.gsc-metrics button + button { border-left: 1px solid var(--gsc-border); }
.gsc-metrics button span { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.gsc-metrics button strong { color: var(--gsc-text); font-size: 26px; font-weight: 400; }
.gsc-metrics button small { opacity: 0.75; }
.gsc-metrics button.active { color: #fff; }
.gsc-metrics button.active strong { color: #fff; }
.gsc-metric--clicks.active { background: var(--gsc-blue); }
.gsc-metric--impressions.active { background: var(--gsc-purple); }
.gsc-metric--ctr.active, .gsc-metric--position.active { color: var(--gsc-text) !important; background: #e8eaed; }
.gsc-metric--ctr.active strong, .gsc-metric--position.active strong { color: var(--gsc-text) !important; }
.gsc-chart { padding: 26px 24px 8px; border-bottom: 1px solid var(--gsc-border); }
.gsc-chart svg { width: 100%; height: 250px; }
.gsc-chart polyline { fill: none; stroke-width: 2; vector-effect: non-scaling-stroke; }
.gsc-chart__clicks { stroke: var(--gsc-blue); }
.gsc-chart__impressions { stroke: var(--gsc-purple); }
.gsc-chart footer { display: flex; justify-content: space-between; color: var(--gsc-muted); font-size: 11px; }
.gsc-table-tabs { display: flex; align-items: center; gap: 10px; padding: 0 18px; border-bottom: 1px solid var(--gsc-border); overflow-x: auto; }
.gsc-table-tabs button { min-height: 52px; padding: 0 10px; border-bottom: 3px solid transparent; color: var(--gsc-muted); white-space: nowrap; }
.gsc-table-tabs button.active { border-color: var(--gsc-blue); color: var(--gsc-blue); font-weight: 600; }
.gsc-table-tabs .q-btn { margin-left: auto; }
.gsc-table-wrap { overflow-x: auto; }
.gsc-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.gsc-table th, .gsc-table td { height: 48px; padding: 0 18px; border-bottom: 1px solid #eee; text-align: right; white-space: nowrap; }
.gsc-table th { color: var(--gsc-muted); font-size: 12px; font-weight: 500; }
.gsc-table th:first-child, .gsc-table td:first-child { width: 100%; text-align: left; white-space: normal; }
.gsc-table tbody tr:hover { background: #f8f9fa; }
.gsc-inspection-search { padding: 22px; }
.gsc-inspection-search form { display: flex; align-items: center; gap: 12px; height: 50px; padding-left: 16px; border: 1px solid var(--gsc-border); border-radius: 4px; }
.gsc-inspection-search input { flex: 1; border: 0; outline: 0; font-size: 14px; }
.gsc-inspection-search button, .gsc-form-card button { align-self: stretch; padding: 0 22px; color: var(--gsc-blue); font-weight: 600; }
.gsc-inspection-result { padding: 28px; }
.gsc-inspection-result > header { display: flex; gap: 18px; }
.gsc-success-icon { display: grid; width: 54px; height: 54px; flex: 0 0 auto; place-items: center; border-radius: 50%; color: #fff; background: var(--gsc-green); font-size: 28px; }
.gsc-inspection-result header p, .gsc-inspected-url { color: var(--gsc-muted); }
.gsc-inspection-actions { display: flex; justify-content: flex-end; gap: 10px; margin: 20px 0; }
.gsc-inspected-url { padding: 14px 0; border-top: 1px solid var(--gsc-border); border-bottom: 1px solid var(--gsc-border); font-size: 13px; word-break: break-all; }
.gsc-detail-list div { display: flex; justify-content: space-between; gap: 20px; padding: 18px 4px; border-bottom: 1px solid #eee; }
.gsc-detail-list dt { display: flex; align-items: center; gap: 10px; }
.gsc-detail-list dt .q-icon { color: var(--gsc-green); }
.gsc-detail-list dd { color: var(--gsc-muted); }
.gsc-report-summary { display: grid; gap: 24px; padding: 26px; }
.gsc-report-summary h2 { margin-bottom: 4px; }
.gsc-report-summary__stats { display: flex; gap: 50px; }
.gsc-report-summary__stats div { display: flex; min-width: 110px; flex-direction: column; }
.gsc-report-summary__stats strong { font-size: 28px; font-weight: 400; }
.gsc-report-summary__stats span { color: var(--gsc-muted); font-size: 12px; }
.gsc-report-summary__stats .good strong { color: var(--gsc-green); }
.gsc-report-summary__stats .warning strong { color: var(--gsc-yellow); }
.gsc-report-summary__stats .poor strong { color: var(--gsc-red); }
.gsc-report-bar { display: flex; height: 10px; overflow: hidden; border-radius: 8px; background: #eee; }
.gsc-report-bar .good { background: var(--gsc-green); }
.gsc-report-bar .warning { background: var(--gsc-yellow); }
.gsc-report-bar .poor { background: var(--gsc-red); }
.gsc-report-card > header { padding-bottom: 18px; border-bottom: 1px solid var(--gsc-border); }
.gsc-validation { color: var(--gsc-muted); }
.gsc-validation.warning { color: #b06000; }
.gsc-validation.good { color: var(--gsc-green); }
.gsc-empty-report { display: flex; min-height: 350px; align-items: center; justify-content: center; flex-direction: column; padding: 40px; text-align: center; }
.gsc-empty-report__icon { display: grid; width: 72px; height: 72px; place-items: center; margin-bottom: 20px; border-radius: 50%; color: var(--gsc-muted); background: #f1f3f4; font-size: 36px; }
.gsc-empty-report__icon.success { color: var(--gsc-green); background: #e6f4ea; }
.gsc-empty-report h2 { margin-bottom: 8px; }
.gsc-empty-inline { display: flex; min-height: 220px; align-items: center; justify-content: center; flex-direction: column; color: var(--gsc-muted); }
.gsc-empty-inline .q-icon { margin-bottom: 10px; color: var(--gsc-green); font-size: 36px; }
.gsc-empty-inline p { color: var(--gsc-text); font-size: 16px; }
.gsc-form-card { padding: 24px; }
.gsc-form-card h2 { margin-bottom: 16px; }
.gsc-form-card form { display: flex; height: 46px; align-items: center; border: 1px solid var(--gsc-border); border-radius: 4px; }
.gsc-form-card form span { padding-left: 14px; color: var(--gsc-muted); }
.gsc-form-card input { flex: 1; align-self: stretch; min-width: 100px; border: 0; outline: 0; }
.gsc-experience-intro { display: flex; align-items: center; gap: 18px; padding: 24px; }
.gsc-experience-intro > .q-icon { color: var(--gsc-blue); font-size: 44px; }
.gsc-experience-card { padding: 24px; }
.gsc-experience-card header { display: flex; align-items: center; gap: 10px; }
.gsc-experience-card > div { display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 4px; margin: 25px 0 18px; padding-bottom: 10px; border-bottom: 8px solid var(--gsc-green); }
.gsc-experience-card > div span, .gsc-experience-card > div small { color: var(--gsc-muted); font-size: 12px; }
.gsc-experience-card > div strong { grid-row: span 2; font-size: 28px; font-weight: 400; }
.gsc-experience-card > p { display: flex; gap: 8px; margin-top: 10px; color: var(--gsc-muted); font-size: 13px; }
.gsc-experience-card > p .q-icon { color: var(--gsc-green); }
.gsc-callout-good { display: flex; align-items: center; gap: 16px; padding: 24px; }
.gsc-callout-good > .q-icon { color: var(--gsc-green); font-size: 38px; }
.gsc-callout-good p { color: var(--gsc-muted); }
.gsc-links-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.gsc-link-card header { display: flex; align-items: center; justify-content: space-between; padding: 20px 18px 10px; }
.gsc-link-card header button { color: var(--gsc-blue); font-size: 12px; font-weight: 600; text-transform: uppercase; }
.gsc-settings-card { padding: 8px 0; }
.gsc-settings-card > h2 { padding: 18px 24px; }
.gsc-settings-card > button { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 18px; width: 100%; min-height: 70px; padding: 10px 24px; border-top: 1px solid #eee; text-align: left; }
.gsc-settings-card > button:hover { background: #f8f9fa; }
.gsc-settings-card > button > .q-icon:first-child { color: var(--gsc-muted); font-size: 22px; }
.gsc-settings-card > button span { display: flex; flex-direction: column; }
.gsc-settings-card small { color: var(--gsc-muted); }

@media (max-width: 1050px) {
  .gsc-topbar { grid-template-columns: 190px minmax(180px, 240px) 1fr auto; }
  .gsc-url-search { min-width: 0; }
  .gsc-workspace { grid-template-columns: 200px minmax(0, 1fr); }
  .gsc-nav-item { padding-inline: 18px; }
  .gsc-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .gsc-metrics button:nth-child(3) { border-left: 0; border-top: 1px solid var(--gsc-border); }
  .gsc-metrics button:nth-child(4) { border-top: 1px solid var(--gsc-border); }
}
@media (max-width: 800px) {
  .gsc-page { height: auto; min-height: calc(100dvh - 130px); overflow: visible; }
  .gsc-topbar { position: sticky; z-index: 5; top: 0; grid-template-columns: 1fr auto; height: auto; padding: 10px 12px; }
  .gsc-brand { font-size: 18px; }
  .gsc-property { grid-column: 1 / -1; grid-row: 2; }
  .gsc-url-search { grid-column: 1 / -1; grid-row: 3; }
  .gsc-topbar__actions { grid-column: 2; grid-row: 1; }
  .gsc-topbar__actions .q-btn:nth-child(-n + 2) { display: none; }
  .gsc-workspace { display: block; height: auto; }
  .gsc-sidebar { display: flex; gap: 4px; padding: 8px; overflow-x: auto; border-right: 0; border-bottom: 1px solid var(--gsc-border); }
  .gsc-nav-label { display: none; }
  .gsc-nav-item { width: auto; min-width: max-content; padding: 0 14px; border-radius: 20px; }
  .gsc-nav-item .q-icon { font-size: 18px; }
  .gsc-content { overflow: visible; padding: 20px 12px 40px; }
  .gsc-page-heading { margin-bottom: 12px; }
  .gsc-page-heading h1 { font-size: 22px; }
  .gsc-overview-grid, .gsc-links-grid { grid-template-columns: 1fr; gap: 0; }
  .gsc-overview-card > header, .gsc-summary-card > header, .gsc-report-card > header { align-items: flex-start; }
  .gsc-chart { overflow-x: auto; }
  .gsc-chart svg { min-width: 680px; }
  .gsc-report-summary__stats { gap: 24px; overflow-x: auto; }
}
@media (max-width: 520px) {
  .gsc-brand__mark { width: 30px; height: 30px; }
  .gsc-topbar__actions { display: none; }
  .gsc-welcome { grid-template-columns: auto 1fr; }
  .gsc-welcome > button { display: none; }
  .gsc-page-heading .gsc-primary-button { display: none; }
  .gsc-metrics { grid-template-columns: 1fr 1fr; }
  .gsc-metrics button { min-height: 112px; padding: 14px; }
  .gsc-metrics button strong { font-size: 22px; }
  .gsc-index-summary { gap: 30px; }
  .gsc-form-card form span { display: none; }
  .gsc-form-card input { padding-left: 12px; }
  .gsc-detail-list div { align-items: flex-start; flex-direction: column; }
}
</style>
