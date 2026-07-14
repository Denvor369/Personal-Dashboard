// Mock data for the Website Command Center. NOT persistent.
// Future tables: websites, website_issues (user_id uuid, RLS). Fields are shaped
// for later GitHub / Vercel / Cloudflare / Search Console sync — no APIs yet.

export type WebsiteStatus = 'Online' | 'In development' | 'Maintenance' | 'Offline' | 'Archived';
export type SslStatus = 'Valid' | 'Expiring' | 'None';

export interface Website {
  id: number;
  name: string;
  domain: string;
  description: string;
  status: WebsiteStatus;
  framework: string;
  hosting: string;
  repositoryUrl: string;
  adminUrl: string;
  productionUrl: string;
  stagingUrl: string;
  searchConsoleProperty: string;
  analyticsProperty: string;
  domainExpiry: string;
  ssl: SslStatus;
  lastDeployment: string;
  openIssues: number;
  notes: string;
  maintenance: { label: string; done: boolean }[];
}

export const websiteStatuses: WebsiteStatus[] = [
  'Online',
  'In development',
  'Maintenance',
  'Offline',
  'Archived',
];

// --- Search Console–style mock performance (deterministic, seeded by site id) ---
export interface SearchDay {
  day: number;
  clicks: number;
  impressions: number;
}
export interface SearchQueryRow {
  query: string;
  clicks: number;
  impressions: number;
}
export interface SearchPerformance {
  days: SearchDay[];
  queries: SearchQueryRow[];
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
}

const siteQueries: Record<string, string[]> = {
  'haruki.dev': ['haruki portfolio', 'haruki dev', 'nuxt portfolio example', 'frontend developer cambodia', 'haruki projects'],
  'sunrisebakery.co': ['sunrise bakery', 'bakery near me', 'sourdough phnom penh', 'birthday cake order', 'croissant delivery'],
};

// ponytail: mulberry32 — tiny seeded PRNG so mock charts are stable across reloads
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function searchPerformance(site: Website): SearchPerformance | null {
  if (!site.searchConsoleProperty) return null;
  const rand = mulberry32(site.id * 7919);
  const base = 12 + Math.round(rand() * 40);
  const days: SearchDay[] = Array.from({ length: 28 }, (_, i) => {
    const weekend = i % 7 >= 5 ? 0.6 : 1;
    const clicks = Math.max(1, Math.round(base * weekend * (0.7 + rand() * 0.6)));
    return { day: i, clicks, impressions: clicks * (18 + Math.round(rand() * 14)) };
  });
  const totalClicks = days.reduce((sum, d) => sum + d.clicks, 0);
  const totalImpressions = days.reduce((sum, d) => sum + d.impressions, 0);
  const names = siteQueries[site.domain] ?? [];
  let remaining = totalClicks;
  const queries = names.map((query, i) => {
    const clicks = Math.max(1, Math.round(remaining * (0.34 - i * 0.04)));
    remaining -= clicks;
    return { query, clicks, impressions: clicks * (14 + Math.round(rand() * 20)) };
  });
  return {
    days,
    queries,
    totalClicks,
    totalImpressions,
    avgCtr: (totalClicks / totalImpressions) * 100,
    avgPosition: 6 + rand() * 14,
  };
}

export const websites: Website[] = [
  {
    id: 1,
    name: 'Personal Portfolio',
    domain: 'haruki.dev',
    description: 'Personal brand and portfolio site.',
    status: 'Online',
    framework: 'Nuxt 3',
    hosting: 'Vercel',
    repositoryUrl: 'https://github.com/example/portfolio',
    adminUrl: '',
    productionUrl: 'https://haruki.dev',
    stagingUrl: 'https://staging.haruki.dev',
    searchConsoleProperty: 'haruki.dev',
    analyticsProperty: 'G-XXXX1',
    domainExpiry: 'Mar 2027',
    ssl: 'Valid',
    lastDeployment: '2 days ago',
    openIssues: 1,
    notes: 'Refresh case studies next.',
    maintenance: [
      { label: 'Dependencies up to date', done: true },
      { label: 'Lighthouse > 90', done: true },
      { label: 'Backup configured', done: false },
    ],
  },
  {
    id: 2,
    name: 'Client — Bakery',
    domain: 'sunrisebakery.co',
    description: 'Marketing site for a local bakery.',
    status: 'Maintenance',
    framework: 'Astro',
    hosting: 'Cloudflare Pages',
    repositoryUrl: 'https://github.com/example/bakery',
    adminUrl: 'https://sunrisebakery.co/admin',
    productionUrl: 'https://sunrisebakery.co',
    stagingUrl: '',
    searchConsoleProperty: 'sunrisebakery.co',
    analyticsProperty: 'G-XXXX2',
    domainExpiry: 'Aug 2026',
    ssl: 'Expiring',
    lastDeployment: '3 weeks ago',
    openIssues: 3,
    notes: 'SSL + domain renewal due soon.',
    maintenance: [
      { label: 'Renew domain', done: false },
      { label: 'Renew SSL', done: false },
      { label: 'Content update', done: true },
    ],
  },
  {
    id: 3,
    name: 'Side Project — Notes app',
    domain: 'quietnotes.app',
    description: 'A minimal notes SaaS experiment.',
    status: 'In development',
    framework: 'Quasar + Supabase',
    hosting: 'Vercel',
    repositoryUrl: 'https://github.com/example/quietnotes',
    adminUrl: '',
    productionUrl: '',
    stagingUrl: 'https://staging.quietnotes.app',
    searchConsoleProperty: '',
    analyticsProperty: '',
    domainExpiry: 'Nov 2026',
    ssl: 'Valid',
    lastDeployment: 'Today',
    openIssues: 5,
    notes: 'MVP in progress.',
    maintenance: [{ label: 'Set up analytics', done: false }],
  },
  {
    id: 4,
    name: 'Old Blog',
    domain: 'oldthoughts.net',
    description: 'Archived personal blog.',
    status: 'Archived',
    framework: 'Jekyll',
    hosting: 'GitHub Pages',
    repositoryUrl: 'https://github.com/example/oldblog',
    adminUrl: '',
    productionUrl: 'https://oldthoughts.net',
    stagingUrl: '',
    searchConsoleProperty: '',
    analyticsProperty: '',
    domainExpiry: 'Expired',
    ssl: 'None',
    lastDeployment: '1 year ago',
    openIssues: 0,
    notes: 'Kept for reference only.',
    maintenance: [],
  },
];
