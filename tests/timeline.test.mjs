import assert from 'node:assert/strict';
import test from 'node:test';
import { isTimelineEntry, timelineEntries } from '../src/data/timeline.mock.ts';

test('accepts complete timeline entries and rejects invalid saved data', () => {
  assert.equal(timelineEntries.every(isTimelineEntry), true);
  assert.equal(isTimelineEntry({ ...timelineEntries[0], date: 'July 2026' }), false);
  assert.equal(isTimelineEntry({ ...timelineEntries[0], importance: 'Urgent' }), false);
});
