# First Implementation Tasks — Widget Engine

_To start **after the blueprint/roadmap are approved.** A numbered sequence of small, independently verifiable coding tasks. Each builds on the previous. Build the engine on a **new canvas route** and do **not** edit `HomePage.vue` until Task 9's explicit coordination step._

Conventions: new widget code lives under `src/modules/widgets/` (see `INTEGRATION_READINESS.md §1`). Persist to `localStorage` first; move to Supabase at Task 8. Introduce the only new runtime dependency at Task 7 (DnD).

> **Prerequisite (separate from the engine):** authentication is a stub (`CODEBASE_AUDIT.md §3`). The engine can be built and tested with `localStorage` persistence without auth, but **Supabase persistence (Task 8) is blocked until auth session + `onAuthStateChange` are wired.** Track that as a separate task owned alongside the knowledge-system developer.

---

### Task 1 — Widget types & empty registry

- **Goal:** Define the engine's contracts and an empty registry. No UI.
- **Files created:** `src/modules/widgets/types.ts` (`WidgetDefinition`, `WidgetInstance`, `WidgetLayout`, `Breakpoint`), `src/modules/widgets/registry.ts` (typed `Map` + `registerWidget`/`getWidget`/`listWidgets`).
- **Files modified:** none.
- **Dependencies:** none.
- **Completion criteria:** `npm run typecheck` + `npm run lint` pass; registry exports compile and are unit-reasoned (a throwaway `.ts` importing them type-checks).
- **Possible conflicts:** none (all-new folder).

### Task 2 — First demo widget + boundary component

- **Goal:** One trivial "Clock" (or "Hello") widget proving the definition shape, plus a loading/error boundary.
- **Files created:** `src/modules/widgets/definitions/clock/index.ts`, `.../clock/Widget.vue`, `src/modules/widgets/components/WidgetBoundary.vue` (`<Suspense>` + `onErrorCaptured`, reusing `AppSkeleton`/`AppEmptyState`).
- **Files modified:** `src/modules/widgets/registry.ts` (register the demo widget).
- **Dependencies:** Task 1. Reuses `src/components/ui/` (design system).
- **Completion criteria:** boundary renders the widget; forcing a throw shows the error state; forcing a delay shows the skeleton. Typecheck/lint pass.
- **Possible conflicts:** consumes `AppSkeleton`/`AppEmptyState` (shared design system) — read-only use, no edits.

### Task 3 — Widget instance + layout store (localStorage)

- **Goal:** Hold placed widget instances and per-breakpoint layouts; persist to `localStorage`.
- **Files created:** `src/stores/widgets.store.ts` (add/remove/update instance, get/set layout per breakpoint, load/save to `localStorage`).
- **Files modified:** none.
- **Dependencies:** Tasks 1–2. Uses Pinia (installed) and native `localStorage`.
- **Completion criteria:** adding/removing a widget persists across reload; typecheck/lint pass.
- **Possible conflicts:** none (new store file; naming distinct from `notes.store`/`ui.store`).

### Task 4 — Static grid renderer + canvas route

- **Goal:** Render placed widgets from the store on a responsive CSS-grid canvas. **No drag yet.**
- **Files created:** `src/modules/widgets/components/WidgetGrid.vue`, `src/pages/DashboardCanvasPage.vue`.
- **Files modified:** `src/router/routes.ts` (add a dev/beta route, e.g. `/canvas`).
- **Dependencies:** Tasks 1–3.
- **Completion criteria:** the demo widget renders inside the boundary on the canvas at desktop and mobile widths; empty canvas shows an `AppEmptyState`; typecheck/lint pass.
- **Possible conflicts:** ⚠️ **`src/router/routes.ts`** is shared (design-system dev route lives here). Add the route with a distinct block; rebase carefully.

### Task 5 — Add-widget picker + remove

- **Goal:** UI to add a widget from the registry and remove an existing one.
- **Files created:** `src/modules/widgets/components/WidgetPicker.vue`.
- **Files modified:** `WidgetGrid.vue` (add/remove controls), `widgets.store.ts` (if a helper is missing).
- **Dependencies:** Tasks 1–4. Uses Quasar `q-dialog` + design-system buttons.
- **Completion criteria:** user can add each registered widget and remove any instance; state persists; typecheck/lint pass.
- **Possible conflicts:** none beyond files created in this sequence.

### Task 6 — Per-widget settings

- **Goal:** Per-instance settings via a shared dialog; the demo widget exposes one setting.
- **Files created:** `src/modules/widgets/components/WidgetSettingsDialog.vue`, `src/modules/widgets/definitions/clock/Settings.vue`.
- **Files modified:** `types.ts` (settings schema on `WidgetDefinition`), `registry.ts`/`clock/index.ts` (wire settings), `widgets.store.ts` (persist per-instance settings).
- **Dependencies:** Tasks 1–5.
- **Completion criteria:** changing a setting updates the widget and persists; typecheck/lint pass.
- **Possible conflicts:** none (own module files).

### Task 7 — Drag-and-drop + resize

- **Goal:** Reorder/resize widgets; layout changes persist per breakpoint. **First new dependency enters here.**
- **Files created:** `src/modules/widgets/composables/useWidgetDnd.ts`.
- **Files modified:** `WidgetGrid.vue` (wire DnD/resize), `package.json` + lockfile (add the chosen DnD lib — see `DEPENDENCY_AUDIT.md`).
- **Dependencies:** Tasks 1–6; one DnD library (`sortablejs`/`gridstack`).
- **Completion criteria:** drag reorders, resize changes span, both persist and survive reload on desktop and touch; reduced-motion respected; typecheck/lint/build pass.
- **Possible conflicts:** ⚠️ **`package.json`/lockfile** are a shared coordination hotspot — announce the dependency add to the other developer and rebase before/after.

### Task 8 — Persist layouts to Supabase _(blocked on auth)_

- **Goal:** Move persistence from `localStorage` to a Supabase `widget_layouts` table with RLS; migrate existing local state on first load.
- **Files created:** `supabase/migrations/<timestamp>_widget_layouts.sql` (table + RLS + indexes), matching types.
- **Files modified:** `src/types/database.types.ts` (add the new table), `widgets.store.ts` (swap storage backend).
- **Dependencies:** Tasks 1–7 **and** a working auth session.
- **Completion criteria:** layouts persist per user across devices; RLS verified (another user can't read them); typecheck/lint/build pass.
- **Possible conflicts:** ⚠️ **`database.types.ts`** and **migration filename ordering** are shared with the knowledge-system developer — coordinate the timestamp so migrations apply in order and the types file merges cleanly.

### Task 9 — Real dashboard integration _(coordination gate)_

- **Goal:** Replace the mock dashboard with the widget canvas as the app's home — **only after agreeing with the dashboard/design owner.**
- **Files created:** none.
- **Files modified:** `src/pages/HomePage.vue` (mount `WidgetGrid`), optionally retire `src/data/dashboard.mock.ts` and duplicate `MobileBottomNavigation`; `MainLayout.vue` `isDashboard` special-case revisited.
- **Dependencies:** Tasks 1–8.
- **Completion criteria:** `/` renders the real widget canvas; mock removed or clearly deprecated; typecheck/lint/build pass; visual check desktop + mobile.
- **Possible conflicts:** 🚫 **`HomePage.vue`, `dashboard.mock.ts`, `src/components/dashboard/*` are owned by another developer.** Do not start this task without explicit handoff. This is the only task that touches their files.

---

## Sequencing notes

- Tasks 1–7 are **fully unblocked** and touch almost only new files (the two shared exceptions — `routes.ts` in Task 4, `package.json` in Task 7 — are flagged).
- Task 8 is the first thing that **needs authentication**; do not schedule it before the auth session is wired.
- Task 9 is a **coordination gate**, not a solo task.
- After each task: run `npm run typecheck`, `npm run lint`, and (from Task 7) `npm run build`, on **Node ≥ 22.22** (`CODEBASE_AUDIT.md §1`).
