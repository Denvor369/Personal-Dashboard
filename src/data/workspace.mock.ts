export type TaskStatus = 'Today' | 'Upcoming' | 'Completed';
export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface WorkspaceTask {
  id: number;
  title: string;
  project: string;
  due: string;
  priority: TaskPriority;
  status: TaskStatus;
  completed: boolean;
  description: string;
}

export interface WorkspaceNote {
  id: number;
  title: string;
  preview: string;
  updated: string;
  tag: string;
  pinned: boolean;
}

export interface WorkspaceEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  duration: string;
  tone: 'mint' | 'teal' | 'dark';
  description: string;
}

export interface MonthDay {
  key: string;
  date: number;
  muted?: boolean;
  today?: boolean;
  eventId?: number;
}

export interface WorkspaceProject {
  id: number;
  name: string;
  description: string;
  progress: number;
  deadline: string;
  status: 'In progress' | 'Planning' | 'At risk' | 'Completed';
  tone: 'cream' | 'mint' | 'teal';
}

export interface SettingsSection {
  id: 'profile' | 'appearance' | 'notifications' | 'services' | 'dashboard' | 'privacy';
  label: string;
  description: string;
  icon: string;
}

// NOTE: `workspaceTasks` is no longer the live data source. Tasks are persisted in
// Supabase via src/modules/tasks (store → service → DB). This mock is kept only as a
// development reference / shape example and must not be imported by TasksPage or the
// Home task widgets. See docs/TASKS_PERSISTENCE.md.
export const workspaceTasks: WorkspaceTask[] = [
  {
    id: 1,
    title: 'Review weekly priorities',
    project: 'Planning',
    due: 'Today, 09:00',
    priority: 'High',
    status: 'Completed',
    completed: true,
    description: 'Confirm the three outcomes that matter most this week.',
  },
  {
    id: 2,
    title: 'Polish dashboard layout',
    project: 'Personal Dashboard',
    due: 'Today, 11:30',
    priority: 'High',
    status: 'Today',
    completed: false,
    description: 'Tighten the workspace layout and responsive behavior.',
  },
  {
    id: 3,
    title: 'Reply to project notes',
    project: 'Admin',
    due: 'Today, 14:00',
    priority: 'Medium',
    status: 'Today',
    completed: false,
    description: 'Close the feedback loop on the latest project review.',
  },
  {
    id: 4,
    title: 'Outline next development step',
    project: 'Personal Dashboard',
    due: 'Today, 16:30',
    priority: 'Medium',
    status: 'Today',
    completed: false,
    description: 'Write the smallest useful scope for the next iteration.',
  },
  {
    id: 5,
    title: 'Plan tomorrow’s focus block',
    project: 'Planning',
    due: 'Tomorrow, 08:30',
    priority: 'Low',
    status: 'Upcoming',
    completed: false,
    description: 'Reserve uninterrupted time for the highest-value task.',
  },
  {
    id: 6,
    title: 'Organize research notes',
    project: 'Knowledge Library',
    due: 'Wed, 10:00',
    priority: 'Medium',
    status: 'Upcoming',
    completed: false,
    description: 'Group recent research into a few useful themes.',
  },
  {
    id: 7,
    title: 'Prepare weekly review',
    project: 'Planning',
    due: 'Fri, 16:00',
    priority: 'Low',
    status: 'Upcoming',
    completed: false,
    description: 'Collect wins, blockers, and open decisions for Friday.',
  },
  {
    id: 8,
    title: 'Archive completed references',
    project: 'Knowledge Library',
    due: 'Jul 10',
    priority: 'Low',
    status: 'Completed',
    completed: true,
    description: 'Move finished research out of the active workspace.',
  },
];

export const workspaceNotes: WorkspaceNote[] = [
  {
    id: 1,
    title: 'Dashboard principles',
    preview: 'Keep the experience focused, useful, and easy to return to each day.',
    updated: 'Today, 09:20',
    tag: 'Product',
    pinned: true,
  },
  {
    id: 2,
    title: 'Ideas worth revisiting',
    preview: 'A short list of thoughts that need a little more time and attention.',
    updated: 'Yesterday',
    tag: 'Ideas',
    pinned: true,
  },
  {
    id: 3,
    title: 'Weekly reflection',
    preview: 'Wins, loose ends, and what deserves focus next week.',
    updated: '2 hours ago',
    tag: 'Planning',
    pinned: false,
  },
  {
    id: 4,
    title: 'Reading list',
    preview: 'Books and essays to return to when there is time to think.',
    updated: 'Monday',
    tag: 'Research',
    pinned: false,
  },
  {
    id: 5,
    title: 'Small reminders',
    preview: 'Useful details that should not have to live in memory.',
    updated: 'Last week',
    tag: 'Personal',
    pinned: false,
  },
  {
    id: 6,
    title: 'Meeting fragments',
    preview: 'Decisions and questions from recent project conversations.',
    updated: 'Jul 9',
    tag: 'Work',
    pinned: false,
  },
  {
    id: 7,
    title: 'Design references',
    preview: 'Patterns that make dense interfaces feel calmer and easier to scan.',
    updated: 'Jul 7',
    tag: 'Design',
    pinned: false,
  },
];

export const workspaceEvents: WorkspaceEvent[] = [
  {
    id: 1,
    title: 'Dashboard design sync',
    date: 'Today',
    time: '10:00',
    duration: '45 min',
    tone: 'mint',
    description: 'Review the compact workspace direction and open interaction questions.',
  },
  {
    id: 2,
    title: 'Deep work block',
    date: 'Wed 15',
    time: '09:30',
    duration: '2 hours',
    tone: 'teal',
    description: 'Uninterrupted implementation time for the current dashboard milestone.',
  },
  {
    id: 3,
    title: 'Weekly review',
    date: 'Fri 17',
    time: '16:00',
    duration: '30 min',
    tone: 'dark',
    description: 'Capture wins, unfinished work, and priorities for next week.',
  },
  {
    id: 4,
    title: 'Personal reset',
    date: 'Sat 18',
    time: '08:30',
    duration: '1 hour',
    tone: 'mint',
    description: 'A quiet block for planning and clearing small loose ends.',
  },
];

export const monthDays: MonthDay[] = [
  { key: 'jun-29', date: 29, muted: true },
  { key: 'jun-30', date: 30, muted: true },
  { key: 'jul-1', date: 1 },
  { key: 'jul-2', date: 2 },
  { key: 'jul-3', date: 3 },
  { key: 'jul-4', date: 4 },
  { key: 'jul-5', date: 5 },
  { key: 'jul-6', date: 6 },
  { key: 'jul-7', date: 7 },
  { key: 'jul-8', date: 8 },
  { key: 'jul-9', date: 9 },
  { key: 'jul-10', date: 10 },
  { key: 'jul-11', date: 11 },
  { key: 'jul-12', date: 12 },
  { key: 'jul-13', date: 13, today: true, eventId: 1 },
  { key: 'jul-14', date: 14 },
  { key: 'jul-15', date: 15, eventId: 2 },
  { key: 'jul-16', date: 16 },
  { key: 'jul-17', date: 17, eventId: 3 },
  { key: 'jul-18', date: 18, eventId: 4 },
  { key: 'jul-19', date: 19 },
  { key: 'jul-20', date: 20 },
  { key: 'jul-21', date: 21 },
  { key: 'jul-22', date: 22 },
  { key: 'jul-23', date: 23 },
  { key: 'jul-24', date: 24 },
  { key: 'jul-25', date: 25 },
  { key: 'jul-26', date: 26 },
  { key: 'jul-27', date: 27 },
  { key: 'jul-28', date: 28 },
  { key: 'jul-29', date: 29 },
  { key: 'jul-30', date: 30 },
  { key: 'jul-31', date: 31 },
  { key: 'aug-1', date: 1, muted: true },
  { key: 'aug-2', date: 2, muted: true },
];

export const workspaceProjects: WorkspaceProject[] = [
  {
    id: 1,
    name: 'Personal dashboard foundation',
    description: 'One clear home for daily planning and focus.',
    progress: 72,
    deadline: 'Jul 24',
    status: 'In progress',
    tone: 'mint',
  },
  {
    id: 2,
    name: 'Knowledge library',
    description: 'A lightweight place for notes and references.',
    progress: 38,
    deadline: 'Aug 8',
    status: 'Planning',
    tone: 'cream',
  },
  {
    id: 3,
    name: 'Weekly planning rhythm',
    description: 'A repeatable review that keeps priorities honest.',
    progress: 84,
    deadline: 'Jul 17',
    status: 'In progress',
    tone: 'teal',
  },
  {
    id: 4,
    name: 'Personal site refresh',
    description: 'Tighten the story and update recent work.',
    progress: 46,
    deadline: 'Jul 20',
    status: 'At risk',
    tone: 'cream',
  },
  {
    id: 5,
    name: 'Reading workflow',
    description: 'Turn highlights into useful connected notes.',
    progress: 100,
    deadline: 'Jul 5',
    status: 'Completed',
    tone: 'mint',
  },
];

export const settingsSections: SettingsSection[] = [
  {
    id: 'profile',
    label: 'Profile',
    description: 'Personal details and account identity.',
    icon: 'person_outline',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Theme and display preferences.',
    icon: 'palette',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Reminders and attention settings.',
    icon: 'notifications_none',
  },
  {
    id: 'services',
    label: 'Connected services',
    description: 'Tools linked to your workspace.',
    icon: 'hub',
  },
  {
    id: 'dashboard',
    label: 'Dashboard preferences',
    description: 'Choose what appears each day.',
    icon: 'dashboard_customize',
  },
  {
    id: 'privacy',
    label: 'Privacy and security',
    description: 'Session and data controls.',
    icon: 'shield',
  },
];
