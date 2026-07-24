// Live end-to-end probe: auth, CRUD per table, realtime delivery.
// Usage: node scripts/verify-supabase.mjs <email> <password>
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n').filter(Boolean).map((line) => line.split('=')),
);
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: node scripts/verify-supabase.mjs <email> <password>');
  process.exit(1);
}
let failed = false;
const log = (name, ok, extra = '') => {
  if (!ok) failed = true;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
};

// --- auth -------------------------------------------------------------------
const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
if (authErr) {
  log('auth', false, authErr.message);
  process.exit(1);
}
log('auth', true, auth.user.id);
const uid = auth.user.id;

// --- realtime listeners (INSERT/UPDATE filtered, DELETE unfiltered — mirrors the stores)
const events = {};
for (const table of ['tasks', 'notes', 'skills']) {
  events[table] = { changes: 0, deletes: 0 };
  await new Promise((resolve) => {
    supabase
      .channel(`probe:${table}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table, filter: `user_id=eq.${uid}` }, () => events[table].changes++)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table, filter: `user_id=eq.${uid}` }, () => events[table].changes++)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table }, () => events[table].deletes++)
      .subscribe((status) => status === 'SUBSCRIBED' && resolve());
    setTimeout(resolve, 5000);
  });
}

// --- per-table CRUD ----------------------------------------------------------
async function crud(table, insertRow, updateRow) {
  const { data: row, error: insErr } = await supabase.from(table).insert(insertRow).select().single();
  log(`${table} insert`, !insErr, insErr?.message);
  if (!row) return null;
  const { error: updErr } = await supabase.from(table).update(updateRow).eq('id', row.id);
  log(`${table} update`, !updErr, updErr?.message);
  const { error: delErr } = await supabase.from(table).delete().eq('id', row.id);
  log(`${table} delete`, !delErr, delErr?.message);
  return row;
}

await crud(
  'tasks',
  { user_id: uid, title: 'probe task', status: 'today', priority: 'low' },
  { title: 'probe task (updated)' },
);
const note = await crud(
  'notes',
  { user_id: uid, title: 'probe note', content: 'hello probe' },
  { content: 'hello probe (updated)' },
);
await crud(
  'skills',
  { user_id: uid, name: 'probe skill', category: 'Other', progress: 10 },
  { practice_minutes: 5 },
);

// --- note extras: tags rpc + full-text search --------------------------------
if (note) {
  const { error: rpcErr } = await supabase.rpc('set_note_tags', { note_id: note.id, tag_names: ['probe'] });
  // The note is already deleted; only a missing rpc / permission error matters here.
  log('set_note_tags rpc reachable', !rpcErr || !rpcErr.message.includes('function'), rpcErr?.message);
}
const { error: searchErr } = await supabase
  .from('notes')
  .select('id')
  .textSearch('search_vector', 'probe', { config: 'simple', type: 'websearch' });
log('notes full-text search', !searchErr, searchErr?.message);

// --- profiles / connected_accounts -------------------------------------------
const { data: profile, error: profErr } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
log('profiles select', !profErr && !!profile, profErr?.message ?? (profile ? '' : 'no row — signup trigger missing?'));
const { error: connErr } = await supabase.from('connected_accounts').select('*');
log('connected_accounts select', !connErr, connErr?.message);

// --- realtime results ---------------------------------------------------------
await new Promise((resolve) => setTimeout(resolve, 3000));
for (const [table, counts] of Object.entries(events)) {
  log(`${table} realtime insert/update`, counts.changes > 0, `${counts.changes} event(s)`);
  log(`${table} realtime delete`, counts.deletes > 0, `${counts.deletes} event(s)`);
}

await supabase.auth.signOut();
process.exit(failed ? 1 : 0);
