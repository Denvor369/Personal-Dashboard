export type BankRecordKind =
  'income' | 'expense' | 'investment' | 'lent' | 'borrowed' | 'debt_received' | 'debt_repaid';

// How necessary a spend was — powers the savings coach's discipline signals.
export type SpendTier = 'essential' | 'important' | 'optional' | 'impulse';

export const spendTiers: Array<{
  value: SpendTier;
  label: string;
  icon: string;
  hint: string;
}> = [
  { value: 'essential', label: 'Essential', icon: 'verified', hint: 'Needs — rent, food, bills' },
  { value: 'important', label: 'Important', icon: 'check_circle', hint: 'Worth it and planned' },
  { value: 'optional', label: 'Optional', icon: 'schedule', hint: 'Nice to have, could wait' },
  { value: 'impulse', label: 'Impulse', icon: 'bolt', hint: 'Spur of the moment' },
];

const spendTierValues = new Set<SpendTier>(spendTiers.map(({ value }) => value));

// Non-essential spend the coach nudges you to reduce.
export const isUnnecessary = (record: BankRecord) =>
  record.kind === 'expense' && (record.tier === 'optional' || record.tier === 'impulse');

// Records saved before tiers existed get a light-touch guess from their label.
export function inferTier(record: BankRecord): SpendTier {
  if (record.tier) return record.tier;
  if (record.kind !== 'expense') return 'important';
  const label = record.label.toLowerCase();
  if (/rent|grocer|util|bill|transport|medical|insur|fuel|water|electric/.test(label))
    return 'essential';
  if (/snack|coffee|game|shopping|entertain|takeaway|delivery|impulse|drink|treat/.test(label))
    return 'impulse';
  if (/subscription|streaming|app|gadget|clothes|outing/.test(label)) return 'optional';
  return 'important';
}

export interface BankRecord {
  id: number;
  kind: BankRecordKind;
  label: string;
  amount: number;
  date: string;
  person?: string;
  tier?: SpendTier;
}

export interface PersonBalance {
  name: string;
  amount: number;
}

export interface BankWeek {
  label: string;
  inflow: number;
  outflow: number;
}

export const openingBankBalance = 10273.9;

export const bankRecordKinds: Array<{
  label: string;
  value: BankRecordKind;
  icon: string;
}> = [
  { label: 'Income', value: 'income', icon: 'south_west' },
  { label: 'Expense', value: 'expense', icon: 'north_east' },
  { label: 'Investment', value: 'investment', icon: 'trending_up' },
  { label: 'Money lent', value: 'lent', icon: 'person_add' },
  { label: 'Money borrowed', value: 'borrowed', icon: 'handshake' },
  { label: 'Debt received', value: 'debt_received', icon: 'payments' },
  { label: 'Debt repaid', value: 'debt_repaid', icon: 'done_all' },
];

export const bankBalanceEffect: Record<BankRecordKind, 1 | -1> = {
  income: 1,
  expense: -1,
  investment: -1,
  lent: -1,
  borrowed: 1,
  debt_received: 1,
  debt_repaid: -1,
};

const bankKindValues = new Set<BankRecordKind>(bankRecordKinds.map(({ value }) => value));

export function isBankRecord(value: unknown): value is BankRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<BankRecord>;
  return Boolean(
    Number.isSafeInteger(record.id) &&
    record.kind &&
    bankKindValues.has(record.kind) &&
    record.label?.trim() &&
    Number.isFinite(record.amount) &&
    Number(record.amount) > 0 &&
    record.date &&
    /^\d{4}-\d{2}-\d{2}$/.test(record.date) &&
    (record.person === undefined || typeof record.person === 'string') &&
    (record.tier === undefined || spendTierValues.has(record.tier)),
  );
}

export const initialBankRecords: BankRecord[] = [
  { id: 1, kind: 'income', label: 'Monthly salary', amount: 2200, date: '2026-07-01' },
  { id: 2, kind: 'income', label: 'Freelance project', amount: 650, date: '2026-07-08' },
  { id: 3, kind: 'expense', label: 'Groceries', amount: 86.4, date: '2026-07-12', tier: 'essential' },
  { id: 4, kind: 'expense', label: 'Subscriptions', amount: 12, date: '2026-07-11', tier: 'optional' },
  { id: 5, kind: 'expense', label: 'Utilities', amount: 125, date: '2026-07-06', tier: 'essential' },
  { id: 6, kind: 'investment', label: 'Index fund', amount: 300, date: '2026-07-09' },
  { id: 11, kind: 'expense', label: 'Coffee run', amount: 6.5, date: '2026-07-08', tier: 'impulse' },
  { id: 12, kind: 'expense', label: 'Online shopping', amount: 34, date: '2026-07-07', tier: 'impulse' },
  { id: 13, kind: 'expense', label: 'Movie night', amount: 18, date: '2026-07-03', tier: 'optional' },
  {
    id: 7,
    kind: 'lent',
    label: 'Short-term loan',
    amount: 420,
    date: '2026-07-05',
    person: 'Maya',
  },
  {
    id: 8,
    kind: 'borrowed',
    label: 'Shared purchase',
    amount: 250,
    date: '2026-07-04',
    person: 'Dara',
  },
  {
    id: 9,
    kind: 'debt_received',
    label: 'Partial repayment',
    amount: 100,
    date: '2026-07-11',
    person: 'Maya',
  },
  {
    id: 10,
    kind: 'debt_repaid',
    label: 'Partial repayment',
    amount: 50,
    date: '2026-07-10',
    person: 'Dara',
  },
];

const money = (value: number) => Math.round(value * 100) / 100;

export function openingBalanceForCurrent(records: BankRecord[], currentBalance: number) {
  const recordedChange = records.reduce(
    (total, record) => total + record.amount * bankBalanceEffect[record.kind],
    0,
  );
  return money(currentBalance - recordedChange);
}

export interface BankDateRange {
  start: string; // inclusive YYYY-MM-DD
  end: string; // inclusive YYYY-MM-DD
}

function defaultRange(): BankDateRange {
  const month = new Date().toISOString().slice(0, 7);
  return { start: `${month}-01`, end: `${month}-31` };
}

// ISO YYYY-MM-DD strings compare lexically, so plain string bounds work.
const inRange = (date: string, range: BankDateRange) => {
  const day = date.slice(0, 10);
  return day >= range.start && day <= range.end;
};

export function summarizeBank(
  records: BankRecord[],
  openingBalance = openingBankBalance,
  range: BankDateRange = defaultRange(),
) {
  const people = new Map<string, { receivable: number; payable: number }>();
  let balance = openingBalance;
  let income = 0;
  let spending = 0;
  let invested = 0;

  for (const record of records) {
    // Balance is cumulative across all records; income/spending scope to the range.
    balance += record.amount * bankBalanceEffect[record.kind];
    if (inRange(record.date, range) && record.kind === 'income') income += record.amount;
    if (inRange(record.date, range) && record.kind === 'expense') spending += record.amount;
    if (record.kind === 'investment') invested += record.amount;
    if (!record.person) continue;

    const account = people.get(record.person) ?? { receivable: 0, payable: 0 };
    if (record.kind === 'lent') account.receivable += record.amount;
    if (record.kind === 'debt_received') account.receivable -= record.amount;
    if (record.kind === 'borrowed') account.payable += record.amount;
    if (record.kind === 'debt_repaid') account.payable -= record.amount;
    people.set(record.person, account);
  }

  const personBalances = (side: 'receivable' | 'payable'): PersonBalance[] =>
    [...people].flatMap(([name, account]) =>
      account[side] > 0 ? [{ name, amount: money(account[side]) }] : [],
    );

  return {
    balance: money(balance),
    income: money(income),
    spending: money(spending),
    net: money(income - spending),
    invested: money(invested),
    receivables: personBalances('receivable'),
    payables: personBalances('payable'),
  };
}

export function analyzeBank(records: BankRecord[], range: BankDateRange = defaultRange()) {
  const weeks: BankWeek[] = ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((label) => ({
    label,
    inflow: 0,
    outflow: 0,
  }));
  const spending = new Map<string, number>();
  let income = 0;
  let expenses = 0;
  let invested = 0;

  for (const record of records.filter(({ date }) => inRange(date, range))) {
    const week = weeks[Math.min(3, Math.floor((Number(record.date.slice(-2)) - 1) / 7))]!;
    const isInflow = bankBalanceEffect[record.kind] > 0;
    week[isInflow ? 'inflow' : 'outflow'] += record.amount;
    if (record.kind === 'income') income += record.amount;
    if (record.kind === 'investment') invested += record.amount;
    if (record.kind === 'expense') {
      expenses += record.amount;
      spending.set(record.label, (spending.get(record.label) ?? 0) + record.amount);
    }
  }

  const available = income - expenses;
  return {
    income: money(income),
    expenses: money(expenses),
    invested: money(invested),
    available: money(available),
    savingsRate: income ? Math.max(0, Math.round((available / income) * 100)) : 0,
    weeks: weeks.map((week) => ({
      ...week,
      inflow: money(week.inflow),
      outflow: money(week.outflow),
    })),
    spending: [...spending]
      .map(([label, amount]) => ({ label, amount: money(amount) }))
      .sort((a, b) => b.amount - a.amount),
  };
}
