// Mock data for Goals & Roadmap. NOT persistent — edits live in component state.
// Future tables: goals, goal_milestones (user_id uuid, RLS).

export type GoalCategory =
  | 'Career'
  | 'Education'
  | 'Finance'
  | 'Projects'
  | 'Business'
  | 'Personal';

export type GoalStatus = 'Planned' | 'Active' | 'Paused' | 'Completed';
export type GoalPriority = 'High' | 'Medium' | 'Low';

export interface Milestone {
  id: number;
  title: string;
  done: boolean;
  targetDate: string;
}

export interface Goal {
  id: number;
  title: string;
  description: string;
  category: GoalCategory;
  targetDate: string;
  progress: number;
  status: GoalStatus;
  priority: GoalPriority;
  motivation: string;
  relatedProject: string;
  milestones: Milestone[];
}

export const goalCategories: GoalCategory[] = [
  'Career',
  'Education',
  'Finance',
  'Projects',
  'Business',
  'Personal',
];

export const goalStatuses: GoalStatus[] = ['Planned', 'Active', 'Paused', 'Completed'];

export const goals: Goal[] = [
  {
    id: 1,
    title: 'Get hired as a web developer',
    description: 'Turn interviews into a signed offer for a frontend role.',
    category: 'Career',
    targetDate: 'Sep 2026',
    progress: 65,
    status: 'Active',
    priority: 'High',
    motivation: 'Financial stability and real-world experience.',
    relatedProject: 'Personal site refresh',
    milestones: [
      { id: 1, title: 'Polish portfolio', done: true, targetDate: 'Jul 2026' },
      { id: 2, title: 'Apply to 20 roles', done: true, targetDate: 'Jul 2026' },
      { id: 3, title: 'Pass 3 technical rounds', done: false, targetDate: 'Aug 2026' },
      { id: 4, title: 'Accept an offer', done: false, targetDate: 'Sep 2026' },
    ],
  },
  {
    id: 2,
    title: 'Finish the CS degree',
    description: 'Stay on track with coursework and final project.',
    category: 'Education',
    targetDate: 'Jun 2027',
    progress: 48,
    status: 'Active',
    priority: 'High',
    motivation: 'Credential + fundamentals that compound.',
    relatedProject: '',
    milestones: [
      { id: 1, title: 'Pass this semester', done: false, targetDate: 'Dec 2026' },
      { id: 2, title: 'Capstone proposal', done: false, targetDate: 'Feb 2027' },
    ],
  },
  {
    id: 3,
    title: 'Save a 6-month runway',
    description: 'Build a buffer to take on freelance risk safely.',
    category: 'Finance',
    targetDate: 'Mar 2027',
    progress: 30,
    status: 'Active',
    priority: 'Medium',
    motivation: 'Freedom to choose better work.',
    relatedProject: '',
    milestones: [{ id: 1, title: 'Reach 2 months saved', done: true, targetDate: 'Jul 2026' }],
  },
  {
    id: 4,
    title: 'Launch the agency brand',
    description: 'Define services, pricing, and a landing page.',
    category: 'Business',
    targetDate: 'Jan 2027',
    progress: 15,
    status: 'Planned',
    priority: 'Medium',
    motivation: 'Own income stream and creative control.',
    relatedProject: 'Agency Hub',
    milestones: [{ id: 1, title: 'Name + logo', done: false, targetDate: 'Oct 2026' }],
  },
  {
    id: 5,
    title: 'Ship 3 portfolio projects',
    description: 'Real, deployed apps that show range.',
    category: 'Projects',
    targetDate: 'Aug 2026',
    progress: 100,
    status: 'Completed',
    priority: 'Medium',
    motivation: 'Proof of skill for employers and clients.',
    relatedProject: 'Personal dashboard foundation',
    milestones: [{ id: 1, title: 'Deploy all three', done: true, targetDate: 'Jul 2026' }],
  },
];
