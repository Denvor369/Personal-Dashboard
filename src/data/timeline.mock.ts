// Mock data for the Personal Timeline. NOT persistent. No uploads.
// Future table: timeline_entries (user_id uuid, RLS).

export type TimelineCategory =
  | 'Career'
  | 'Education'
  | 'Project'
  | 'Skill'
  | 'Achievement'
  | 'Personal'
  | 'Finance'
  | 'Memory';

export type Importance = 'Low' | 'Medium' | 'High';

export interface TimelineEntry {
  id: number;
  title: string;
  date: string; // ISO-ish 'YYYY-MM-DD' for grouping/sorting
  year: number;
  month: string;
  category: TimelineCategory;
  description: string;
  relatedProject: string;
  relatedGoal: string;
  tags: string[];
  importance: Importance;
}

export const timelineCategories: TimelineCategory[] = [
  'Career',
  'Education',
  'Project',
  'Skill',
  'Achievement',
  'Personal',
  'Finance',
  'Memory',
];

const categoryValues = new Set<TimelineCategory>(timelineCategories);
const importanceValues = new Set<Importance>(['Low', 'Medium', 'High']);

export function isTimelineEntry(value: unknown): value is TimelineEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<TimelineEntry>;
  return Boolean(
    Number.isSafeInteger(entry.id) &&
    entry.title?.trim() &&
    entry.date &&
    /^\d{4}-\d{2}-\d{2}$/.test(entry.date) &&
    Number.isInteger(entry.year) &&
    entry.year === Number(entry.date.slice(0, 4)) &&
    entry.month?.trim() &&
    entry.category &&
    categoryValues.has(entry.category) &&
    typeof entry.description === 'string' &&
    typeof entry.relatedProject === 'string' &&
    typeof entry.relatedGoal === 'string' &&
    Array.isArray(entry.tags) &&
    entry.tags.every((tag) => typeof tag === 'string') &&
    entry.importance &&
    importanceValues.has(entry.importance),
  );
}

export const timelineEntries: TimelineEntry[] = [
  { id: 1, title: 'Shipped the personal dashboard', date: '2026-07-01', year: 2026, month: 'July', category: 'Project', description: 'Launched a compact, themeable dashboard for daily focus.', relatedProject: 'Personal dashboard foundation', relatedGoal: 'Ship 3 portfolio projects', tags: ['vue', 'quasar'], importance: 'High' },
  { id: 2, title: 'First technical interview', date: '2026-06-24', year: 2026, month: 'June', category: 'Career', description: 'Passed a live coding round for a frontend role.', relatedProject: '', relatedGoal: 'Get hired as a web developer', tags: ['interview'], importance: 'High' },
  { id: 3, title: 'Finished advanced TypeScript course', date: '2026-05-18', year: 2026, month: 'May', category: 'Skill', description: 'Generics, conditional types, and inference in depth.', relatedProject: '', relatedGoal: '', tags: ['typescript'], importance: 'Medium' },
  { id: 4, title: 'Reached 2 months of runway saved', date: '2026-04-30', year: 2026, month: 'April', category: 'Finance', description: 'On track toward a freelance safety buffer.', relatedProject: '', relatedGoal: 'Save a 6-month runway', tags: ['savings'], importance: 'Medium' },
  { id: 5, title: 'Started the CS degree', date: '2025-09-15', year: 2025, month: 'September', category: 'Education', description: 'Enrolled and set a graduation target.', relatedProject: '', relatedGoal: 'Finish the CS degree', tags: ['university'], importance: 'High' },
  { id: 6, title: 'Built my first deployed site', date: '2025-06-10', year: 2025, month: 'June', category: 'Achievement', description: 'A small business site — my first real client win.', relatedProject: '', relatedGoal: '', tags: ['freelance'], importance: 'Medium' },
];
