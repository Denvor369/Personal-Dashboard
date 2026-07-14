import assert from 'node:assert/strict';
import test from 'node:test';
import { authRedirect, safeInternalRedirect } from '../src/router/auth-guard.ts';

const route = {
  fullPath: '/notes?view=pinned',
  guestOnly: false,
  path: '/notes',
  requiresAuth: true,
  requiresProfile: true,
};

test('protects private routes and prevents open redirects', () => {
  assert.deepEqual(authRedirect(route, { authenticated: false, profileComplete: false }), {
    path: '/auth/login',
    query: { redirect: '/notes?view=pinned' },
  });
  assert.deepEqual(authRedirect(route, { authenticated: true, profileComplete: false }), {
    path: '/auth/profile-setup',
  });
  assert.equal(authRedirect(route, { authenticated: true, profileComplete: true }), null);
  assert.equal(safeInternalRedirect('/calendar'), '/calendar');
  assert.equal(safeInternalRedirect('//evil.example'), '/');
  assert.equal(safeInternalRedirect('https://evil.example'), '/');
});
