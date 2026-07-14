// Savings-coach data model + pure derivations. No framework code, no side effects,
// so everything here is easy to unit-reason about and reuse.
import type { BankRecord, SpendTier } from './bank.mock';
import { inferTier } from './bank.mock';

// ----- savings goals -----
export interface SavingsGoal {
  name: string;
  saved: number;
  target: number;
  icon: string;
}

export const savingsGoalPresets: Array<{ name: string; icon: string }> = [
  { name: 'Emergency Fund', icon: 'health_and_safety' },
  { name: 'New Phone', icon: 'smartphone' },
  { name: 'Laptop Upgrade', icon: 'laptop_mac' },
  { name: 'Travel Fund', icon: 'flight' },
];

export const defaultSavingsGoal: SavingsGoal = {
  name: 'Emergency Fund',
  saved: 640,
  target: 1500,
  icon: 'health_and_safety',
};

// ----- think twice -----
export interface ThinkTwiceItem {
  id: number;
  name: string;
  price: number;
  addedAt: number; // epoch ms
}

export function seedThinkTwice(now: number): ThinkTwiceItem[] {
  return [
    { id: 1, name: 'Wireless earbuds', price: 79, addedAt: now - 5 * 3600_000 },
    { id: 2, name: 'Mechanical keyboard', price: 110, addedAt: now - 31 * 3600_000 },
  ];
}

// ----- recurring bills -----
export interface RecurringBill {
  id: number;
  name: string;
  amount: number;
  dueDay: number; // day of month, 1-31
  category: string;
  icon: string;
  paid: boolean;
}

export function seedBills(): RecurringBill[] {
  return [
    { id: 1, name: 'Rent', amount: 450, dueDay: 28, category: 'Housing', icon: 'home', paid: false },
    { id: 2, name: 'Internet', amount: 22, dueDay: 20, category: 'Utilities', icon: 'wifi', paid: false },
    { id: 3, name: 'Phone plan', amount: 15, dueDay: 18, category: 'Utilities', icon: 'smartphone', paid: false },
    { id: 4, name: 'Streaming', amount: 12, dueDay: 15, category: 'Subscriptions', icon: 'movie', paid: true },
  ];
}

// Reserve toward savings + a minimum balance buffer used by "safe to spend".
export const SAVINGS_RESERVE = 200;
export const MIN_BALANCE_BUFFER = 100;

// ----- reminders -----
export const reminderMessages = [
  'Small discipline today creates freedom later.',
  'Skip one unnecessary expense today and add it to savings.',
  'Protect your future self.',
  'Every dollar you keep is a step toward your goal.',
  'You do not need it today — sleep on it first.',
];

// ----- badges -----
export interface CoachStats {
  savedRatio: number; // 0..1 progress to goal
  streak: number;
  bestStreak: number;
  impulseMonth: number;
  score: number;
  trackedDays: number;
}

export interface CoachBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: (stats: CoachStats) => number; // 0..1, >=1 means unlocked
}

export const coachBadges: CoachBadge[] = [
  {
    id: 'first-save',
    name: 'First Save',
    description: 'Put something toward a goal',
    icon: 'savings',
    progress: (s) => (s.savedRatio > 0 ? 1 : 0),
  },
  {
    id: 'discipline',
    name: 'Discipline Mode',
    description: '3-day no-spend streak',
    icon: 'self_improvement',
    progress: (s) => Math.min(1, s.streak / 3),
  },
  {
    id: 'guardian',
    name: 'Budget Guardian',
    description: 'Under $40 impulse this month',
    icon: 'shield',
    progress: (s) => (s.impulseMonth <= 40 ? 1 : Math.max(0, 40 / s.impulseMonth)),
  },
  {
    id: 'warrior',
    name: 'Savings Warrior',
    description: 'Reach 50% of your goal',
    icon: 'military_tech',
    progress: (s) => Math.min(1, s.savedRatio / 0.5),
  },
  {
    id: 'monk',
    name: 'Money Monk',
    description: '7-day streak and 80+ score',
    icon: 'spa',
    progress: (s) => Math.min(1, (Math.min(1, s.streak / 7) + Math.min(1, s.score / 80)) / 2),
  },
];

// ----- derivations -----
const DAY = 86_400_000;
const day = (d: string) => d.slice(0, 10);
const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T00:00:00`) - Date.parse(`${a}T00:00:00`)) / DAY);

const isUnnecessarySpend = (record: BankRecord) => {
  if (record.kind !== 'expense') return false;
  const tier = inferTier(record);
  return tier === 'optional' || tier === 'impulse';
};

// No-spend streak = days since the last unnecessary purchase; best = longest clean gap.
export function computeStreak(records: BankRecord[], today: string): { current: number; best: number } {
  if (!records.length) return { current: 0, best: 0 };
  const dates = [...records].map((r) => day(r.date)).sort();
  const firstDate = dates[0]!;
  const unneeded = records.filter(isUnnecessarySpend).map((r) => day(r.date)).sort();

  if (!unneeded.length) {
    const span = Math.max(0, daysBetween(firstDate, today));
    return { current: span, best: span };
  }
  const last = unneeded[unneeded.length - 1]!;
  const current = Math.max(0, daysBetween(last, today));

  let best = current;
  best = Math.max(best, daysBetween(firstDate, unneeded[0]!)); // clean run before first slip
  for (let i = 1; i < unneeded.length; i += 1) {
    best = Math.max(best, daysBetween(unneeded[i - 1]!, unneeded[i]!) - 1);
  }
  return { current, best: Math.max(0, best) };
}

export function disciplineScore(input: {
  savedRatio: number;
  impulseShare: number; // impulse spend / total expense, 0..1
  streak: number;
  trackedDays: number;
  surplus: boolean;
}): number {
  const savings = Math.min(1, input.savedRatio) * 25;
  const restraint = (1 - Math.min(1, input.impulseShare)) * 30;
  const streak = Math.min(1, input.streak / 14) * 20;
  const tracking = Math.min(1, input.trackedDays / 8) * 15;
  const surplus = input.surplus ? 10 : 0;
  return Math.max(0, Math.min(100, Math.round(savings + restraint + streak + tracking + surplus)));
}

export function scoreStatus(score: number): string {
  if (score >= 80) return 'You are staying in control';
  if (score >= 60) return 'You are on track';
  if (score >= 40) return 'Building steady habits';
  return "Let's rebuild the basics";
}

// Sum expenses per tier within an inclusive [start, end] date range.
export function tierBreakdown(
  records: BankRecord[],
  range: { start: string; end: string },
): Record<SpendTier, number> {
  const totals: Record<SpendTier, number> = {
    essential: 0,
    important: 0,
    optional: 0,
    impulse: 0,
  };
  for (const record of records) {
    if (record.kind !== 'expense') continue;
    const d = day(record.date);
    if (d < range.start || d > range.end) continue;
    totals[inferTier(record)] += record.amount;
  }
  return totals;
}

export const roundMoney = (value: number) => Math.round(value * 100) / 100;
