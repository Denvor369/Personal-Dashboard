# Codebase Audit

_Audited: 2026-07-13 · branch `feature/personal-knowledge-system` · read-only, no application code changed._

Goal of this audit: judge how ready the current project is to grow into a **Personal Operating System** (custom widgets; tasks/notes/projects; Gmail, YouTube, Search Console; Khmer lunar calendar + Cambodian holidays; notifications; PWA; Android/iOS via Capacitor).

## 1. Stack snapshot

| Area | What's installed | Notes |
|---|---|---|
| Framework | Quasar `2.21`, `@quasar/app-vite 3`, Vite `8` | Modern, SPA mode, hash router |
| UI/Vue | Vue `3.5`, vue-router `5`, `@quasar/extras` | `<script setup>` + Composition API throughout |
| State | Pinia `3` | Composition-style stores |
| Data | `@supabase/supabase-js 2.110`, `@tanstack/vue-query 5.101` | Both wired via boot files |
| Types | TypeScript `6` (strict), `vue-tsc 3` | `strict: true`, `vueShim: true` |
| Lint/format | ESLint `9` flat config (type-checked) + Prettier | `recommendedTypeChecked`, `consistent-type-imports` |
| PWA | Workbox `GenerateSW`, `register-service-worker` | Manifest present |
| Native | Capacitor `8` (`com.denvor.personaldashboard`) | No platform folders generated yet |
| Runtime | **Node ≥ 22.22 required** by `@quasar/app-vite 3` | The system `~/.local/node` (v20) fails the build; use Node 24 |

Build, typecheck and lint pass on Node 24.

## 2. What is already complete

- **App shell & routing.** `MainLayout` (`q-layout`) + `AppHeader`, `DesktopSidebar` (`q-drawer`), `MobileBottomNavigation`. Routes are lazy-loaded; a dev-only `/design-system` route is guarded by `import.meta.env.DEV`. Navigation is centralized in `src/router/navigation.ts`.
- **Design system.** `src/css/tokens.scss` (semantic `--color-*` + spacing/radius/shadow/transition/breakpoint tokens, light + `.body--dark`), `fonts.scss` (Micuale/Charsey/Altere `@font-face` + type scale), `quasar.variables.scss` (brand palette drives Quasar), `app.scss` (reset, focus-visible, reduced-motion, scrollbar, utilities). Eight reusable primitives in `src/components/ui/` (`AppButton/Card/IconButton/Progress/Badge/SectionHeader/EmptyState/Skeleton`) with a live `DesignSystemPage` showcase.
- **Notes module (data-backed).** `src/stores/notes.store.ts` implements Supabase-backed CRUD with optimistic updates, tag sync via RPC, full-text search, and pagination. `NotesPage.vue` (545 lines) + `NoteEditorDialog.vue` (381 lines) are real, not placeholders.
- **Supabase schema.** One migration (`202607130001_personal_knowledge_system.sql`) defines `notes`, `tags`, `item_tags` (polymorphic), `item_links` (graph edges), `inbox_items`, `note_templates`, `smart_collections`. Every table has **RLS enabled** with correct `(select auth.uid()) = user_id` policies, purpose-built indexes (incl. GIN for `search_vector` and `record_types`), `updated_at` triggers, an ownership-guard trigger, cascade-cleanup trigger, and three `security invoker`/`definer` RPCs (`set_note_tags`, `search_knowledge`, `ensure_default_note_templates`) with explicit `grant`/`revoke` and `set search_path = ''`. This is production-grade.
- **Hand-authored DB types.** `src/types/database.types.ts` (308 lines) matches the schema and is consumed by the typed Supabase client.
- **Data-layer defaults.** `vue-query` boot sets `staleTime 60s`, `refetchOnWindowFocus false`, `retry 1`. `supabase` boot fails fast if env is missing.

## 3. What is partially complete

- **Authentication — STUB.** `src/stores/auth.store.ts` only declares refs (`currentUser`, `session`, `loading`, `initialized`); there is **no session bootstrap, no `onAuthStateChange` listener, no sign-in/out, no router guard**. Yet `notes.store` calls `supabase.auth.getUser()` and throws "Sign in to view and save your notes." → the notes feature cannot function end-to-end until auth is wired. **This is the single biggest gap** and a prerequisite for every user-scoped feature.
- **Dashboard / "widgets".** `HomePage.vue` renders six cards from `src/data/dashboard.mock.ts`. It is **static presentation with hardcoded mock data** — not a widget engine, not user-configurable, not data-wired. It's a useful visual reference for the final widget look, nothing more.
- **PWA.** Manifest exists but `theme_color` (`#4f46e5`) and `background_color` (`#f7f7f8`) are stale placeholders (pre-rebrand). `GenerateSW` precaches the app shell but there is no runtime-caching strategy for Supabase/Google requests or offline mutation queueing.
- **Capacitor.** Configured, but no `android/`/`ios/` platform folders and no native plugins (push, preferences, browser) installed.

## 4. What is missing (relative to the POS goal)

- Google OAuth, Gmail, YouTube, Search Console — **nothing** (see `INTEGRATION_READINESS.md`).
- **Edge Functions** — no `supabase/functions/`, no `supabase/config.toml`, no CLI project link. Required before any secure Google token exchange / API proxying.
- **Khmer lunar calendar & Cambodian holidays** — nothing; `CalendarPage.vue` is a "Coming soon" placeholder.
- **Tasks & projects** — placeholders only. `item_tags`/`inbox_items` already reserve `'task'`, `'project'`, `'goal'` type values, but no tables back them yet.
- **Notifications** — none (no push, no local notifications, no in-app notification store/table).
- **Widget engine** — none.
- **Realtime, router auth guards, tests** — none.

## 5. Keep / Refactor-later / Blockers

**Keep as-is:** the stack, the boot pattern, the Supabase schema (its polymorphic `item_tags` + `item_links` design extends cleanly to tasks/projects/calendar), the design system, the notes module, vue-query defaults.

**Refactor later (not now):**
- **Two data-fetching philosophies.** `notes.store` does manual reactive fetching and **bypasses vue-query**, so there is no cross-component cache/dedup. Pick one pattern (recommend vue-query for server state, Pinia for UI/session state) before adding more read-heavy features.
- **Duplicate `MobileBottomNavigation`.** One in `components/layout/`, one in `components/dashboard/`. `MainLayout` hides its shell chrome on `/` via an `isDashboard` special-case. Consolidate once the widget canvas replaces the mock dashboard.
- **PWA manifest** colors/theming to match the brand.
- **Wide selects / exact counts.** `notes.store` uses `select('*')` and `count: 'exact'` per page — fine now, revisit for egress (see `SECURITY_AND_PERFORMANCE.md`).

**Blockers for future integrations:**
1. **No auth session** → no user context; every integration is blocked until this is wired.
2. **No Edge Function infrastructure** → OAuth token exchange and secret handling have nowhere secure to live.
3. **Hash router mode** → OAuth redirect URIs and Supabase `detectSessionInUrl` need explicit handling (works, but must be designed).
4. **No `supabase/config.toml`** → local Edge Function dev and `supabase secrets` management aren't set up.

## 6. Can the folder structure support independent modules?

**Yes, with a light convention change.** Today the tree is organized by *type* (`components/<feature>/`, `stores/*.store.ts`, `pages/`). That works for a handful of features but will blur ownership as modules multiply and as two-plus developers work in parallel (already an issue: design-system and notes work overlap in `src/css/*` and `package.json`).

Recommendation: introduce a **feature-module** root, `src/modules/<feature>/`, for self-contained subsystems (widgets, google, calendar-khmer, tasks), each owning its `components/`, `composables/`, `store.ts`, `types.ts`, and (where relevant) `registry.ts`. Keep `src/components/ui/` and `src/css/` as the shared design system, and keep truly cross-cutting stores (`auth`, `ui`) in `src/stores/`. This co-locates a module's code, makes ownership boundaries obvious, and lets each module be lazy-loaded as its own chunk. It composes with — doesn't replace — the current structure. Exact widget-engine locations are in `INTEGRATION_READINESS.md §1`.

## 7. Ownership note (coordination)

Two agents are active in this working tree. `docs/AI_WORK_STATUS.md` records that the other agent owns the **knowledge system** (schema, DB types, notes module, `NotesPage.vue`) and is deliberately not touching the design system. The design-system files (`src/css/*`, `src/components/ui/*`, `DesignSystemPage.vue`) and `src/components/dashboard/*` are the other in-flight stream. Shared-contention files to coordinate on: `package.json`, `src/css/tokens.scss` + `app.scss`, `src/router/routes.ts`, `src/router/navigation.ts`, `src/types/database.types.ts`, and **Supabase migration filenames** (timestamp ordering must not collide).
