# Dependency Audit

_No packages installed. This is a recommendation list only._

## Principle

The current `package.json` is lean and healthy — Quasar, Vue, Pinia, vue-router, supabase-js, vue-query, and dev tooling. **Prefer native platform features and existing dependencies before adding anything.** Quasar already ships components, icons (`material-icons`), dark mode, breakpoints, and dialogs, so most UI needs are already covered. Add a package only when a feature concretely needs it, and add it in the task that needs it (not preemptively) to keep bundles and the shared `package.json` diff small — `package.json` is a coordination hotspot between the two active developers.

## Already covered by the current stack (do NOT add)

- **HTTP client** → native `fetch`. No axios.
- **Icons** → `@quasar/extras` `material-icons`. Don't add an icon pack.
- **Dialogs / drawers / lists / virtual scroll / notifications** → Quasar (`q-dialog`, `q-drawer`, `q-virtual-scroll`, `Notify`).
- **Server-state caching / dedup / retries** → `@tanstack/vue-query` (already booted; use it for new read-heavy features instead of hand-rolled fetching).
- **UUIDs** → native `crypto.randomUUID()` (already used in `notes.store`).
- **Google API SDK** → **do not add `googleapis`** (huge, Node-oriented). Call Google REST endpoints with `fetch` from Edge Functions.

## Recommended (evaluate when the matching feature starts)

| Package | Purpose | Why | Native possible? | Bundle | Maintenance | Install when |
|---|---|---|---|---|---|---|
| `@vueuse/core` | Composition utilities (`useLocalStorage`, `useIntersectionObserver` for lazy widgets, `useEventListener`, breakpoints) | Removes repetitive boilerplate across widgets/calendar; tree-shakeable | Partially (each util is writable by hand) | Small, per-import | Excellent, very active | **Widget engine start** |
| Drag-and-drop lib — `sortablejs` (+ `sortablejs-vue3`) **or** `gridstack` | Reorder/resize widgets on a grid | Grid DnD + resize is genuinely hard to get right (touch, a11y, collisions); native HTML5 DnD is clumsy on mobile | Yes, but costly and error-prone | Sortable ~40 KB; gridstack heavier | Both maintained; gridstack does grid+resize out of the box | **DnD task only** (build static grid first) |
| `date-fns` | Gregorian date math/formatting for calendar & Search Console ranges | Tree-shakeable, immutable, no global patching | Yes (`Intl`/`Temporal`) for simple cases | Tiny per-function | Excellent | Calendar/analytics work |
| Khmer lunar lib — `@thyrith/momentkh` (or port the algorithm) | Chhankitek lunar-date calculation | Saves implementing the algorithm | Yes — algorithm is documented; porting avoids a dependency | n/a | ⚠️ depends on **moment.js** (deprecated, large) — a real concern | Calendar work — **prefer porting the pure algorithm** into `modules/calendar-khmer/lunar.ts` and validating it, over shipping moment |
| `jose` (Edge Functions, Deno) | JWT verification / signing in Edge Functions if needed | Standards-based, Deno-friendly | Partially via WebCrypto | Server-side only (no client bundle) | Excellent | If Edge Functions need manual JWT work |
| `zod` | Input validation in Edge Functions (and optionally forms) | Runtime validation at the OAuth/API trust boundary | Yes (hand-written guards) | Server-side; ~14 KB if used client | Excellent | OAuth/Edge-Function work |

## Capacitor plugins (mobile only — install when building native)

| Plugin | Purpose | Install when | Native alternative |
|---|---|---|---|
| `@capacitor/preferences` | Persist tokens/layout on device | Mobile persistence | localStorage (web) |
| `@capacitor/browser` | In-app browser for OAuth on device | Mobile Google OAuth | System browser deep-link |
| `@capacitor/push-notifications` | Remote push (FCM/APNs) | Push notifications feature | — |
| `@capacitor/local-notifications` | Scheduled reminders (holidays, tasks) | Reminders feature | — |
| `@capacitor/app` | Deep-link / app-state handling for OAuth return | Mobile OAuth | — |

Adding these pulls in native (Android Studio / Xcode) build requirements — defer until the mobile milestone.

## Explicitly discouraged

- `googleapis` (bundle/runtime mismatch — use `fetch`).
- `moment` / `moment-timezone` (deprecated, large) — a reason to port the Khmer algorithm rather than depend on `momentkh`.
- A second UI kit / CSS framework — the design system + Quasar already cover this.
- A heavy charting library for Search Console — start with small SVG/CSS or a lightweight, tree-shakeable option; decide only when the widget exists.

## Recommendation

Install nothing now. The first justified addition is **`@vueuse/core`** at the start of the widget engine, and a **DnD library only** at the drag-and-drop task. Everything else waits for its feature. Coordinate every `package.json` change with the other active developer.
