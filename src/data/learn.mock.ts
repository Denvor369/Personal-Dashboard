export type SkillCategory =
  | 'Music'
  | 'DevOps'
  | 'Programming'
  | 'Language'
  | 'Fitness'
  | 'Design'
  | 'Other';

export const skillCategories: SkillCategory[] = [
  'Music',
  'DevOps',
  'Programming',
  'Language',
  'Fitness',
  'Design',
  'Other',
];

export interface LearnSkill {
  id: string;
  name: string;
  category: SkillCategory;
  goal: string;
  progress: number; // 0-100, self-assessed mastery
  practiceMinutes: number; // accrued by the focus timer
  createdAt: string;
}

// Seed content shown on first visit (before anything is saved locally).
// Fresh array each call so callers can mutate without touching the seed.
export function defaultSkills(): LearnSkill[] {
  return [
    {
      id: 'guitar',
      name: 'Play the guitar',
      category: 'Music',
      goal: 'Play a full song cleanly with smooth chord changes.',
      progress: 15,
      practiceMinutes: 90,
      createdAt: '2026-07-01',
    },
    {
      id: 'devops',
      name: 'DevOps foundations',
      category: 'DevOps',
      goal: 'Ship with CI/CD, Docker, and the basics of Kubernetes.',
      progress: 30,
      practiceMinutes: 240,
      createdAt: '2026-06-20',
    },
    {
      id: 'typescript',
      name: 'Advanced TypeScript',
      category: 'Programming',
      goal: 'Confident with generics, narrowing, and utility types.',
      progress: 55,
      practiceMinutes: 420,
      createdAt: '2026-05-10',
    },
  ];
}
