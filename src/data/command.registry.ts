// Central command registry. Commands are built from a runtime context so the
// palette/quick-add stay declarative — no hardcoded actions scattered in components.
import type { Command, CommandContext, QuickAddType } from '@/types/command.types';
import {
  workspaceTasks,
  workspaceNotes,
  workspaceProjects,
  workspaceEvents,
} from '@/data/workspace.mock';

export interface QuickAddOption {
  type: QuickAddType;
  label: string;
  description: string;
  icon: string;
  /** Page to open. Omitted for modules without a form yet (Coming soon). */
  route?: string;
  comingSoon?: boolean;
}

export const quickAddOptions: QuickAddOption[] = [
  { type: 'task', label: 'Task', description: 'Capture the next useful action', icon: 'check_circle', route: '/tasks' },
  { type: 'note', label: 'Note', description: 'Write something down', icon: 'sticky_note_2', route: '/notes' },
  { type: 'event', label: 'Event', description: 'Add to your calendar', icon: 'event', route: '/calendar' },
  { type: 'project', label: 'Project', description: 'Start tracking a project', icon: 'workspaces', route: '/projects' },
  { type: 'finance', label: 'Finance record', description: 'Log income or spending', icon: 'account_balance_wallet', route: '/bank' },
  { type: 'savings', label: 'Savings goal', description: 'Not available yet', icon: 'savings', comingSoon: true },
  { type: 'learning', label: 'Learning session', description: 'Track focused study', icon: 'school', route: '/learn' },
];

const pages = [
  { id: 'nav-dashboard', label: 'Dashboard', icon: 'dashboard', path: '/', keywords: ['home', 'overview'] },
  { id: 'nav-tasks', label: 'Tasks', icon: 'checklist', path: '/tasks', keywords: ['todo', 'action'] },
  { id: 'nav-notes', label: 'Notes', icon: 'sticky_note_2', path: '/notes', keywords: ['memo'] },
  { id: 'nav-learn', label: 'Learn', icon: 'school', path: '/learn', keywords: ['study', 'skills'] },
  { id: 'nav-calendar', label: 'Calendar', icon: 'calendar_month', path: '/calendar', keywords: ['schedule', 'events'] },
  { id: 'nav-projects', label: 'Projects', icon: 'workspaces', path: '/projects', keywords: ['work'] },
  { id: 'nav-bank', label: 'Bank', icon: 'account_balance', path: '/bank', keywords: ['finance', 'money'] },
  { id: 'nav-career', label: 'Career Hub', icon: 'work_history', path: '/career', keywords: ['jobs', 'applications', 'interviews'] },
  { id: 'nav-goals', label: 'Goals & Roadmap', icon: 'flag', path: '/goals', keywords: ['goals', 'milestones'] },
  { id: 'nav-websites', label: 'Website Command Center', icon: 'language', path: '/websites', keywords: ['sites', 'domains', 'deploy'] },
  { id: 'nav-connected-apps', label: 'Connected Apps', icon: 'hub', path: '/connected-apps', keywords: ['integrations', 'oauth'] },
  { id: 'nav-timeline', label: 'Personal Timeline', icon: 'history', path: '/timeline', keywords: ['history', 'moments'] },
  { id: 'nav-agency', label: 'Agency Hub', icon: 'business_center', path: '/agency', keywords: ['clients', 'business'] },
  { id: 'nav-settings', label: 'Settings', icon: 'settings', path: '/settings', keywords: ['preferences', 'account'] },
] as const;

// Creation commands for the new modules. Route to the page (which owns the form);
// no persistence yet — consistent with the mock-data first version.
const moduleCreates = [
  { id: 'create-application', label: 'Add job application', icon: 'work_history', path: '/career', keywords: ['career', 'job', 'apply'] },
  { id: 'create-goal', label: 'Create goal', icon: 'flag', path: '/goals', keywords: ['goal', 'milestone'] },
  { id: 'create-website', label: 'Add website', icon: 'language', path: '/websites', keywords: ['site', 'domain'] },
  { id: 'create-moment', label: 'Add timeline moment', icon: 'history', path: '/timeline', keywords: ['timeline', 'moment'] },
  { id: 'create-client', label: 'Add agency client', icon: 'business_center', path: '/agency', keywords: ['agency', 'client'] },
] as const;

/** Static commands: navigation, creation, and standalone actions. */
export function buildCommands(ctx: CommandContext): Command[] {
  const nav: Command[] = pages.map((p) => ({
    id: p.id,
    label: p.label,
    description: `Go to ${p.label}`,
    icon: p.icon,
    group: 'Pages',
    keywords: [...p.keywords],
    execute: () => ctx.navigate(p.path),
  }));

  const create: Command[] = quickAddOptions.map((o) => ({
    id: `create-${o.type}`,
    label: `Create ${o.label.toLowerCase()}`,
    description: o.description,
    icon: o.icon,
    group: 'Create',
    keywords: ['new', 'add', o.type],
    ...(o.comingSoon ? { enabled: false, disabledReason: `${o.label} isn’t available yet` } : {}),
    execute: () => ctx.quickAdd(o.type),
  }));

  const actions: Command[] = [
    {
      id: 'action-focus-timer',
      label: 'Focus timer',
      description: 'Open the focus timer on your dashboard',
      icon: 'timer',
      group: 'Actions',
      keywords: ['start', 'pause', 'pomodoro', 'focus'],
      execute: () => ctx.navigate('/'),
    },
    {
      id: 'action-toggle-theme',
      label: 'Switch theme',
      description: 'Toggle light and dark appearance',
      icon: 'dark_mode',
      group: 'Actions',
      keywords: ['dark', 'light', 'appearance', 'theme'],
      execute: () => ctx.toggleTheme(),
    },
  ];

  const moduleCreate: Command[] = moduleCreates.map((c) => ({
    id: c.id,
    label: c.label,
    description: 'Opens the module (mock — not persistent yet)',
    icon: c.icon,
    group: 'Create',
    keywords: ['new', 'add', ...c.keywords],
    execute: () => ctx.navigate(c.path),
  }));

  return [...nav, ...create, ...moduleCreate, ...actions];
}

/** Search the local mock/store data. Only runs when there's a query. */
export function searchWorkspace(query: string, ctx: CommandContext): Command[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hit = (text: string) => text.toLowerCase().includes(q);
  const out: Command[] = [];

  for (const t of workspaceTasks) {
    if (hit(`${t.title} ${t.project}`))
      out.push({ id: `data-task-${t.id}`, label: t.title, description: `Task · ${t.project}`, icon: 'check_circle', group: 'Tasks', execute: () => ctx.navigate('/tasks') });
  }
  for (const n of workspaceNotes) {
    if (hit(`${n.title} ${n.preview} ${n.tag}`))
      out.push({ id: `data-note-${n.id}`, label: n.title, description: `Note · ${n.tag}`, icon: 'sticky_note_2', group: 'Notes', execute: () => ctx.navigate('/notes') });
  }
  for (const p of workspaceProjects) {
    if (hit(`${p.name} ${p.description}`))
      out.push({ id: `data-project-${p.id}`, label: p.name, description: `Project · ${p.status}`, icon: 'workspaces', group: 'Projects', execute: () => ctx.navigate('/projects') });
  }
  for (const e of workspaceEvents) {
    if (hit(`${e.title} ${e.description}`))
      out.push({ id: `data-event-${e.id}`, label: e.title, description: `Event · ${e.date}`, icon: 'event', group: 'Calendar', execute: () => ctx.navigate('/calendar') });
  }
  return out;
}
