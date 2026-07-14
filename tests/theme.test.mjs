import assert from 'node:assert/strict';
import test from 'node:test';
import { botanicalTheme } from '../src/themes/botanical.theme.ts';
import { midnightBlueTheme } from '../src/themes/midnight-blue.theme.ts';

test('keeps both brands and both appearances complete', () => {
  assert.deepEqual([botanicalTheme.id, midnightBlueTheme.id], ['botanical', 'midnight-blue']);
  assert.equal(midnightBlueTheme.tokens.light['--color-background'], '#EAE0CF');
  assert.equal(midnightBlueTheme.tokens.dark['--color-background'], '#090D28');
  assert.equal(midnightBlueTheme.tokens.light['--color-nav-active-bg'], '#111844');
  assert.equal(midnightBlueTheme.tokens.dark['--color-nav-active-bg'], '#EAE0CF');

  for (const theme of [botanicalTheme, midnightBlueTheme]) {
    assert.ok(Object.keys(theme.tokens.light).length > 40);
    assert.deepEqual(Object.keys(theme.tokens.light).sort(), Object.keys(theme.tokens.dark).sort());
  }
});
