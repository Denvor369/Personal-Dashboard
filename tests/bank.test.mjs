import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeBank,
  isBankRecord,
  openingBalanceForCurrent,
  summarizeBank,
} from '../src/data/bank.mock.ts';

test('summarizes balance, cash flow, investments, and personal debts', () => {
  const records = [
    { id: 1, kind: 'income', label: 'Pay', amount: 100, date: '2026-07-01' },
    { id: 2, kind: 'expense', label: 'Food', amount: 30, date: '2026-07-02' },
    { id: 3, kind: 'investment', label: 'Fund', amount: 20, date: '2026-07-03' },
    { id: 4, kind: 'lent', label: 'Loan', amount: 50, date: '2026-07-04', person: 'A' },
    { id: 5, kind: 'borrowed', label: 'Loan', amount: 40, date: '2026-07-05', person: 'B' },
    {
      id: 6,
      kind: 'debt_received',
      label: 'Paid back',
      amount: 10,
      date: '2026-07-06',
      person: 'A',
    },
    { id: 7, kind: 'debt_repaid', label: 'Paid back', amount: 15, date: '2026-07-07', person: 'B' },
  ];

  const july = { start: '2026-07-01', end: '2026-07-31' };

  assert.deepEqual(summarizeBank(records, 1000, july), {
    balance: 1035,
    income: 100,
    spending: 30,
    net: 70,
    invested: 20,
    receivables: [{ name: 'A', amount: 40 }],
    payables: [{ name: 'B', amount: 25 }],
  });
  assert.equal(isBankRecord(records[0]), true);
  assert.equal(isBankRecord({ ...records[0], amount: -1 }), false);

  assert.equal(openingBalanceForCurrent(records, 500), 465);

  assert.deepEqual(analyzeBank(records, july), {
    income: 100,
    expenses: 30,
    invested: 20,
    available: 70,
    savingsRate: 70,
    weeks: [
      { label: 'Week 1', inflow: 150, outflow: 115 },
      { label: 'Week 2', inflow: 0, outflow: 0 },
      { label: 'Week 3', inflow: 0, outflow: 0 },
      { label: 'Week 4', inflow: 0, outflow: 0 },
    ],
    spending: [{ label: 'Food', amount: 30 }],
  });
});
