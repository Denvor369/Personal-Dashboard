# Security & Performance Audit

_Read-only assessment. No code or configuration changed._

---

## Part A — Security

### A1. Supabase Row Level Security — **strong today, must stay a rule**

Every existing table (`notes`, `tags`, `item_tags`, `item_links`, `inbox_items`, `note_templates`, `smart_collections`) has RLS **enabled** with correct owner policies using the optimized `(select auth.uid()) = user_id` form. Triggers enforce tag ownership and cascade cleanup; RPCs use `security invoker`/`definer` deliberately with `set search_path = ''`. This is a good baseline.

**Requirement going forward:** every new table (tasks, projects, calendar events, `google_accounts`, `oauth_tokens`, `widget_layouts`, `notifications`, `audit_log`) **must** enable RLS with the same owner pattern in the same migration that creates it. Add a review checklist item: "no table ships without an RLS policy."

### A2. OAuth token storage — the highest-risk new surface

- **Refresh tokens are server-only.** Store encrypted (Supabase **Vault**/pgsodium, or app-level AES via a `TOKEN_ENCRYPTION_KEY` held as an Edge-Function secret). Never send a refresh token to the client; never store it in `localStorage`.
- **Access tokens** are short-lived; **prefer not exposing them to the client at all** — proxy Google API calls through Edge Functions so the browser never holds a Google token.
- The `oauth_tokens`/`google_accounts` table must be RLS-protected *and* ideally only reachable via `service_role` inside Edge Functions, not via the anon client.

### A3. Edge Functions — not set up yet (prerequisite)

There is no `supabase/functions/` or `supabase/config.toml`. Before any Google work:
- Every function must **verify the caller's Supabase JWT** and derive `user_id` server-side (never trust a client-supplied user id).
- Secrets via `supabase secrets set` (see env list in `INTEGRATION_READINESS.md §2.6`).
- Validate all input at the function boundary (`zod` or hand-written guards).

### A4. API secrets

Current `.env` correctly holds only the anon key. **Never** place `GOOGLE_CLIENT_SECRET` or the Supabase **service-role key** in a `VITE_`-prefixed variable or any client file — `VITE_` vars are bundled into the browser. Document this in the README (already warned there for the service-role key).

### A5. Refresh-token lifecycle, disconnection, revocation

- **Disconnect flow:** call Google's token **revocation** endpoint, then delete the stored token row, then flip the account's connection state. Do all three atomically in an Edge Function.
- **Rotation/expiry:** handle refresh failures gracefully (mark account "needs reconnect", surface a "Connect again" empty-state in dependent widgets). Note the Testing-mode 7-day refresh-token expiry caveat from `INTEGRATION_READINESS.md §2.8`.

### A6. Rate limiting — currently none

Add **per-user** rate limiting in Edge Functions before calling Google (protects Google quota *and* prevents a compromised client from hammering APIs). A simple Postgres token-bucket keyed by `user_id`+`api`, or an external limiter, is enough. Also cache Google responses (below) to reduce call volume.

### A7. Input validation

DB `CHECK` constraints are solid (length bounds, jsonb-object checks, enum-like `in (...)`). Add matching validation at the Edge-Function boundary for anything Google/OAuth, and keep client-side validation for UX only (never as the security boundary).

### A8. Audit logs — none

Add an append-only `audit_log` table (RLS: owner can read, only `service_role`/triggers can write) recording sensitive events: account connect/disconnect, token refresh failures, scope grants, data exports. Useful for a personal OS and cheap to add.

### A9. Multiple connected accounts

Design for **N Google accounts per user** from day one: key the tokens/accounts table by `(user_id, google_sub)` rather than assuming one row per user. Widgets should reference a specific connected account.

### Security summary

| Control | Status | Action |
|---|---|---|
| RLS on existing tables | ✅ Correct | Keep the rule for all new tables |
| OAuth token storage | ⬜ Not built | Server-only, encrypted, proxied |
| Edge Functions + JWT verify | ⬜ Not built | Prerequisite for Google |
| Client/server secret split | ✅ Anon-only client | Keep secrets out of `VITE_` |
| Rate limiting | ⬜ None | Per-user, in Edge Functions |
| Revoke on disconnect | ⬜ None | Revoke + delete + state |
| Audit log | ⬜ None | Append-only, RLS |
| Multi-account | ⬜ N/A | Key by `(user_id, google_sub)` |

---

## Part B — Performance

### B1. Duplicate Supabase queries / data layer split

`notes.store` fetches with manual reactivity and **bypasses vue-query**, so two components reading notes = two round trips with no shared cache or dedup. It also runs a 3-query sequence per page (notes → `item_tags` → `tags`). **Recommendation:** standardize new read paths on vue-query (dedup, caching, background refetch already configured); consider a DB view/RPC that returns notes-with-tags in one call if the N+1 shape grows.

### B2. Realtime subscriptions

None today. When added (e.g. notifications), cap and clean up: unsubscribe on unmount, multiplex related data on **one channel** rather than opening many, and avoid a realtime subscription per widget instance.

### B3. External API requests (Google)

Proxy + cache. Set per-endpoint `staleTime` in vue-query and cache upstream responses at the Edge layer where possible. This protects Google **quota** (YouTube Data API defaults to ~10,000 units/day; Gmail/Search Console have their own limits) and reduces Supabase egress.

### B4. Large dashboard bundles

Widgets **must** be async: registry lazy-loads each `Widget.vue` via `defineAsyncComponent`, so a dashboard with 20 widget types ships only the code for placed widgets. Keep the mock `dashboard.mock.ts` out of production bundles once the real engine lands.

### B5. Module lazy loading / code splitting

Routes are already lazy-loaded (good). Keep each `src/modules/*` feature as its own chunk. The dev-only `/design-system` route is already `import.meta.env.DEV`-gated and excluded from production builds.

### B6. Widget-level caching & offline

Per-widget vue-query cache with sensible `staleTime`; for offline, persist critical query results to `localStorage`/IndexedDB. The current `GenerateSW` precaches the app shell but has **no runtime caching** for Supabase/Google responses and **no offline mutation queue** — revisit with a runtime-caching strategy (possibly `InjectManifest`) when offline support becomes a goal.

### B7. Mobile performance

Virtualize long lists (`q-virtual-scroll`); notes already paginate (page size 30). Avoid heavy dependencies on the mobile critical path (another reason to port the Khmer algorithm rather than ship moment.js). Test on a mid-range Android device once Capacitor platforms are generated.

### B8. Supabase egress

- `notes.store` uses `select('*')` and `count: 'exact'` per page. Wide selects and exact counts increase egress/cost; select only needed columns and prefer `count: 'estimated'`/`'planned'` where an exact total isn't required.
- Cache aggressively (B1/B3) so repeated views don't re-fetch.
- Keep realtime payloads minimal.

### Performance summary

| Risk | Status | Action |
|---|---|---|
| Data-layer split (no dedup/cache for notes) | ⚠️ Present | Standardize on vue-query |
| Realtime subscription sprawl | ⬜ Future | One channel, cleanup on unmount |
| Google quota / egress | ⬜ Future | Proxy + cache + rate limit |
| Dashboard bundle size | ⬜ Future | Async widgets via registry |
| Code splitting | ✅ Routes lazy | Keep per-module chunks |
| Offline behavior | ⚠️ Shell only | Runtime caching + mutation queue |
| Wide selects / exact counts | ⚠️ Minor | Narrow selects, estimated counts |
