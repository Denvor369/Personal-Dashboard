// Mock data for the Career Hub. NOT persistent — edits live in component state.
// Future table: career_applications (user_id uuid, RLS). See docs/NEW_MODULES_OVERVIEW.md.

export type ApplicationStatus =
  | 'Saved'
  | 'Applied'
  | 'Seen'
  | 'Interview'
  | 'Technical test'
  | 'Rejected'
  | 'Offer'
  | 'Accepted';

export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Freelance' | 'Internship';

export interface JobApplication {
  id: number;
  company: string;
  position: string;
  jobType: JobType;
  location: string;
  salaryRange: string;
  appliedDate: string;
  status: ApplicationStatus;
  jobUrl: string;
  contactPerson: string;
  followUpDate: string; // '' = none
  notes: string;
  cvVersion: string;
  portfolioVersion: string;
}

export interface Interview {
  id: number;
  company: string;
  round: string;
  date: string;
  mode: 'On-site' | 'Video' | 'Phone';
  notes: string;
}

export interface CareerDocument {
  id: number;
  name: string;
  type: 'CV' | 'Cover letter' | 'Portfolio' | 'Certificate';
  updated: string;
  link: string;
}

export interface SkillGap {
  id: number;
  skill: string;
  current: number; // 0-100
  target: number; // 0-100
  learningPlan: string;
}

export const applicationStatuses: ApplicationStatus[] = [
  'Saved',
  'Applied',
  'Seen',
  'Interview',
  'Technical test',
  'Rejected',
  'Offer',
  'Accepted',
];

export const jobTypes: JobType[] = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];

export const jobApplications: JobApplication[] = [
  { id: 1, company: 'Northwind Studio', position: 'Frontend Developer', jobType: 'Full-time', location: 'Remote', salaryRange: '$55k–70k', appliedDate: 'Jul 8', status: 'Interview', jobUrl: 'https://example.com/jobs/1', contactPerson: 'Dana Reeve', followUpDate: 'Jul 15', notes: 'Strong Vue focus. Liked the portfolio.', cvVersion: 'CV · Frontend v3', portfolioVersion: 'Portfolio 2026' },
  { id: 2, company: 'Bright Ledger', position: 'Full-stack Engineer', jobType: 'Full-time', location: 'Hybrid · Berlin', salaryRange: '€60k–75k', appliedDate: 'Jul 5', status: 'Technical test', jobUrl: 'https://example.com/jobs/2', contactPerson: 'Marco Vidal', followUpDate: 'Jul 14', notes: 'Take-home due this week.', cvVersion: 'CV · Full-stack v2', portfolioVersion: 'Portfolio 2026' },
  { id: 3, company: 'Loop & Co', position: 'Junior Web Developer', jobType: 'Contract', location: 'Remote', salaryRange: '$40k–50k', appliedDate: 'Jul 2', status: 'Applied', jobUrl: 'https://example.com/jobs/3', contactPerson: '', followUpDate: '', notes: '', cvVersion: 'CV · Frontend v3', portfolioVersion: 'Portfolio 2026' },
  { id: 4, company: 'Cedar Labs', position: 'UI Engineer', jobType: 'Freelance', location: 'Remote', salaryRange: 'Day rate', appliedDate: 'Jun 28', status: 'Offer', jobUrl: 'https://example.com/jobs/4', contactPerson: 'Priya Anand', followUpDate: 'Jul 13', notes: 'Offer received — reviewing terms.', cvVersion: 'CV · Frontend v3', portfolioVersion: 'Portfolio 2026' },
  { id: 5, company: 'Meridian Apps', position: 'Frontend Developer', jobType: 'Full-time', location: 'On-site · Lisbon', salaryRange: '€45k–55k', appliedDate: 'Jun 20', status: 'Rejected', jobUrl: 'https://example.com/jobs/5', contactPerson: '', followUpDate: '', notes: 'Wanted more backend depth.', cvVersion: 'CV · Frontend v2', portfolioVersion: 'Portfolio 2025' },
  { id: 6, company: 'Fern Digital', position: 'Web Developer', jobType: 'Part-time', location: 'Remote', salaryRange: '$30k–38k', appliedDate: 'Jul 10', status: 'Saved', jobUrl: 'https://example.com/jobs/6', contactPerson: '', followUpDate: '', notes: 'Looks promising, apply this week.', cvVersion: '', portfolioVersion: '' },
];

export const interviews: Interview[] = [
  { id: 1, company: 'Northwind Studio', round: 'Hiring manager', date: 'Jul 15 · 14:00', mode: 'Video', notes: 'Prep: component architecture, testing.' },
  { id: 2, company: 'Bright Ledger', round: 'Technical review', date: 'Jul 16 · 10:30', mode: 'Video', notes: 'Walk through the take-home.' },
  { id: 3, company: 'Cedar Labs', round: 'Culture chat', date: 'Jul 17 · 16:00', mode: 'Phone', notes: 'Final step before signing.' },
];

export const careerDocuments: CareerDocument[] = [
  { id: 1, name: 'CV · Frontend v3', type: 'CV', updated: 'Jul 6', link: '#' },
  { id: 2, name: 'CV · Full-stack v2', type: 'CV', updated: 'Jun 30', link: '#' },
  { id: 3, name: 'Cover letter · Studio roles', type: 'Cover letter', updated: 'Jul 1', link: '#' },
  { id: 4, name: 'Portfolio 2026', type: 'Portfolio', updated: 'Jul 9', link: 'https://example.com' },
  { id: 5, name: 'Meta Frontend Certificate', type: 'Certificate', updated: 'May 2026', link: '#' },
];

export const skillGaps: SkillGap[] = [
  { id: 1, skill: 'TypeScript', current: 70, target: 90, learningPlan: 'Advanced types course' },
  { id: 2, skill: 'System design', current: 40, target: 75, learningPlan: 'Weekly design drills' },
  { id: 3, skill: 'Testing (Vitest)', current: 55, target: 85, learningPlan: 'Add tests to projects' },
  { id: 4, skill: 'Backend / APIs', current: 45, target: 70, learningPlan: 'Node + Supabase build' },
];

export const careerRoadmap = [
  { id: 1, phase: 'Now', title: 'Land a frontend role', detail: 'Convert active interviews into an offer.', done: false },
  { id: 2, phase: 'Next 6 months', title: 'Grow full-stack depth', detail: 'Ship a Supabase-backed product end to end.', done: false },
  { id: 3, phase: 'This year', title: 'Senior-track skills', detail: 'System design, testing, mentoring.', done: false },
  { id: 4, phase: 'Later', title: 'Freelance + agency income', detail: 'Blend employment with agency clients.', done: false },
];
