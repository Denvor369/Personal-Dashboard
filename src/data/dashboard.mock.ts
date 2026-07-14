export interface DashboardStat {
  label: string;
  value: string;
  detail: string;
}

export interface CurrentFocus {
  eyebrow: string;
  title: string;
  description: string;
  progress: number;
}

export interface ProgressDay {
  label: string;
  hours: number;
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  current?: boolean;
}

export interface DashboardTask {
  id: number;
  title: string;
  category: string;
  completed: boolean;
}

export interface QuickAccessItem {
  id: string;
  label: string;
  detail: string;
  icon: string;
}

export type CalendarEventTone = 'deep' | 'teal' | 'mint';

export interface CalendarEvent {
  id: number;
  title: string;
  time: string;
  tone: CalendarEventTone;
}

export interface CalendarDay {
  label: string;
  date: number;
  current?: boolean;
  events: CalendarEvent[];
}

export const dashboardOverview = {
  greeting: 'Welcome back, Denvor',
  message: 'Monday, July 13 · Make space for one meaningful thing today.',
  dailyProgress: 68,
  stats: [
    { label: "Today's tasks", value: '6', detail: '3 completed' },
    { label: 'Focus time', value: '3h 20m', detail: '40m from goal' },
    { label: 'Active projects', value: '4', detail: '2 moving today' },
  ] satisfies DashboardStat[],
};

export const currentFocus: CurrentFocus = {
  eyebrow: 'Current focus',
  title: 'Personal dashboard foundation',
  description: 'Shape the core experience and keep the first release focused.',
  progress: 72,
};

export const weeklyProgress = {
  totalHours: '31.5',
  change: '+4.2h from last week',
  days: [
    { label: 'Mon', hours: 4.5, level: 6 },
    { label: 'Tue', hours: 5.2, level: 7 },
    { label: 'Wed', hours: 3.8, level: 5 },
    { label: 'Thu', hours: 6.4, level: 9 },
    { label: 'Fri', hours: 4.9, level: 7 },
    { label: 'Sat', hours: 2.7, level: 4 },
    { label: 'Sun', hours: 4, level: 6, current: true },
  ] satisfies ProgressDay[],
};

export const focusTimer = {
  task: 'Dashboard visual direction',
  durationSeconds: 25 * 60,
  remainingSeconds: 18 * 60 + 36,
};

export const todayTasks: DashboardTask[] = [
  { id: 1, title: 'Review weekly priorities', category: 'Planning', completed: true },
  { id: 2, title: 'Polish dashboard layout', category: 'Design', completed: true },
  { id: 3, title: 'Reply to project notes', category: 'Admin', completed: true },
  { id: 4, title: 'Outline next development step', category: 'Project', completed: false },
  { id: 5, title: 'Take an afternoon walk', category: 'Personal', completed: false },
  { id: 6, title: 'Plan tomorrow’s focus block', category: 'Planning', completed: false },
];

export const quickAccessItems: QuickAccessItem[] = [
  { id: 'notes', label: 'Quick notes', detail: '3 notes edited this week', icon: 'edit_note' },
  { id: 'links', label: 'Saved links', detail: '12 references ready to revisit', icon: 'bookmark' },
  {
    id: 'files',
    label: 'Recent files',
    detail: 'Dashboard brief and weekly plan',
    icon: 'description',
  },
  { id: 'devices', label: 'Devices', detail: 'Laptop and phone connected', icon: 'devices' },
];

export const calendarDays: CalendarDay[] = [
  {
    label: 'Mon',
    date: 13,
    current: true,
    events: [{ id: 1, title: 'Weekly planning', time: '09:00', tone: 'deep' }],
  },
  {
    label: 'Tue',
    date: 14,
    events: [{ id: 2, title: 'Deep work', time: '10:30', tone: 'mint' }],
  },
  {
    label: 'Wed',
    date: 15,
    events: [{ id: 3, title: 'Project review', time: '14:00', tone: 'teal' }],
  },
  { label: 'Thu', date: 16, events: [] },
  {
    label: 'Fri',
    date: 17,
    events: [{ id: 4, title: 'Focus sprint', time: '11:00', tone: 'deep' }],
  },
  {
    label: 'Sat',
    date: 18,
    events: [{ id: 5, title: 'Personal reset', time: '08:30', tone: 'mint' }],
  },
  { label: 'Sun', date: 19, events: [] },
];
