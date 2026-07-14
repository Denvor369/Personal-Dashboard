// Typed integration registry for Connected Apps.
// Only GitHub has a real connection flow (token in connected_accounts, RLS).
// Every other service is catalog-only: its setup guide opens, but no fake
// connection, token storage, or OAuth request is allowed yet.

export type IntegrationStatus =
  'Not connected' | 'Connected' | 'Coming soon' | 'Needs attention' | 'Syncing' | 'Error';

export type IntegrationCategory =
  'Google' | 'Analytics' | 'Development' | 'Design' | 'Hosting & Monitoring';

export const integrationCategories: IntegrationCategory[] = [
  'Google',
  'Analytics',
  'Development',
  'Design',
  'Hosting & Monitoring',
];

export interface Integration {
  id: string;
  name: string;
  category: IntegrationCategory;
  icon: string;
  description: string;
  status: IntegrationStatus;
  account: string; // '' when not connected
  permissions: string[];
  capabilities: string[]; // data this integration will surface in the dashboard
  lastSynced: string; // '' when never
  syncFrequency: string;
  connectEnabled: boolean; // true only when a real connect flow exists
}

export const integrations: Integration[] = [
  // --- Google ---
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'Google',
    icon: 'mail',
    description: 'Read job-related email and follow-ups.',
    status: 'Coming soon',
    account: '',
    permissions: ['Read messages'],
    capabilities: ['Job-related email', 'Follow-up reminders'],
    lastSynced: '',
    syncFrequency: 'Manual',
    connectEnabled: false,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'Google',
    icon: 'smart_display',
    description: 'Track learning playlists and channel stats.',
    status: 'Coming soon',
    account: '',
    permissions: ['Read channel data'],
    capabilities: ['Learning playlists', 'Channel statistics'],
    lastSynced: '',
    syncFrequency: 'Manual',
    connectEnabled: false,
  },
  {
    id: 'search-console',
    name: 'Google Search Console',
    category: 'Google',
    icon: 'travel_explore',
    description: 'Search performance for your websites.',
    status: 'Coming soon',
    account: '',
    permissions: ['Read search analytics'],
    capabilities: ['Clicks & impressions', 'Top queries', 'Indexing status'],
    lastSynced: '',
    syncFrequency: 'Daily',
    connectEnabled: false,
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    category: 'Google',
    icon: 'calendar_month',
    description: 'Sync interviews and deadlines.',
    status: 'Coming soon',
    account: '',
    permissions: ['Read/write events'],
    capabilities: ['Events in Khmer calendar', 'Interview reminders'],
    lastSynced: '',
    syncFrequency: 'Hourly',
    connectEnabled: false,
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    category: 'Google',
    icon: 'add_to_drive',
    description: 'Store CV versions and documents.',
    status: 'Coming soon',
    account: '',
    permissions: ['Read/write files'],
    capabilities: ['CV versions', 'Document links'],
    lastSynced: '',
    syncFrequency: 'Manual',
    connectEnabled: false,
  },
  // --- Analytics ---
  {
    id: 'google-analytics',
    name: 'Google Analytics 4',
    category: 'Analytics',
    icon: 'analytics',
    description: 'Visitors, sessions, and traffic sources.',
    status: 'Coming soon',
    account: '',
    permissions: ['Read reporting data'],
    capabilities: [
      'Visitors & sessions',
      'Traffic sources',
      'Popular pages',
      'Devices',
      'Daily changes',
    ],
    lastSynced: '',
    syncFrequency: 'Daily',
    connectEnabled: false,
  },
  {
    id: 'pagespeed-insights',
    name: 'PageSpeed Insights',
    category: 'Analytics',
    icon: 'speed',
    description: 'Performance, accessibility, and SEO scores.',
    status: 'Coming soon',
    account: '',
    permissions: ['Public API — no account data'],
    capabilities: [
      'Performance score',
      'Accessibility score',
      'SEO score',
      'Best practices',
      'Main issues',
    ],
    lastSynced: '',
    syncFrequency: 'Weekly',
    connectEnabled: false,
  },
  // --- Development ---
  {
    id: 'github',
    name: 'GitHub',
    category: 'Development',
    icon: 'code',
    description: 'Repositories, issues, and deploys.',
    status: 'Not connected',
    account: '',
    permissions: ['Read repos', 'Read issues'],
    capabilities: ['Repository status', 'Open issues', 'Deploy history'],
    lastSynced: '',
    syncFrequency: 'Hourly',
    connectEnabled: true,
  },
  {
    id: 'supabase',
    name: 'Supabase',
    category: 'Development',
    icon: 'storage',
    description: 'Project status, database, and auth usage.',
    status: 'Coming soon',
    account: '',
    permissions: ['Read project stats'],
    capabilities: ['Project status', 'Database usage', 'Auth users', 'Storage usage', 'Log links'],
    lastSynced: '',
    syncFrequency: 'Daily',
    connectEnabled: false,
  },
  {
    id: 'sentry',
    name: 'Sentry',
    category: 'Development',
    icon: 'bug_report',
    description: 'Application errors and crash reports.',
    status: 'Coming soon',
    account: '',
    permissions: ['Read issues & events'],
    capabilities: ['Recent errors', 'Affected users', 'Unresolved issues', 'Performance problems'],
    lastSynced: '',
    syncFrequency: 'Hourly',
    connectEnabled: false,
  },
  // --- Design ---
  {
    id: 'figma',
    name: 'Figma',
    category: 'Design',
    icon: 'design_services',
    description: 'Recent design files and prototypes.',
    status: 'Coming soon',
    account: '',
    permissions: ['Read files & projects'],
    capabilities: ['Recent files', 'Projects', 'Last modified', 'Prototype links'],
    lastSynced: '',
    syncFrequency: 'Manual',
    connectEnabled: false,
  },
  // --- Hosting & Monitoring ---
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    category: 'Hosting & Monitoring',
    icon: 'cloud',
    description: 'DNS, domains, and Pages.',
    status: 'Coming soon',
    account: '',
    permissions: ['Read DNS', 'Read Pages'],
    capabilities: ['DNS records', 'Domain expiry', 'Pages deployments'],
    lastSynced: '',
    syncFrequency: 'Daily',
    connectEnabled: false,
  },
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'Hosting & Monitoring',
    icon: 'rocket_launch',
    description: 'Deployments and project status.',
    status: 'Coming soon',
    account: '',
    permissions: ['Read deployments'],
    capabilities: ['Deploy status', 'Build history', 'Project links'],
    lastSynced: '',
    syncFrequency: 'On deploy',
    connectEnabled: false,
  },
  {
    id: 'better-stack',
    name: 'Better Stack',
    category: 'Hosting & Monitoring',
    icon: 'monitor_heart',
    description: 'Uptime, response time, and incidents.',
    status: 'Coming soon',
    account: '',
    permissions: ['Read monitors & incidents'],
    capabilities: [
      'Uptime',
      'Response time',
      'Active incidents',
      'Downtime history',
      'Status page',
    ],
    lastSynced: '',
    syncFrequency: 'Hourly',
    connectEnabled: false,
  },
];

export const integrationSecurityNote =
  'Only services with an active Connect button can request credentials. Planned services never open a fake connection or store anything.';
