# Integration Readiness

_Planning only. No credentials created, no accounts connected, no code written._

---

## 1. Widget engine readiness

The current dashboard (`HomePage.vue` + `dashboard.mock.ts`) is a static, hardcoded layout. A real widget engine needs a **registry** (what widget types exist), **definitions** (each widget's component + settings + metadata), **instances** (a user's placed widgets), **layouts** (per-breakpoint positions), **settings**, **permissions** (which integrations a widget requires), **loading/error boundaries**, and **drag-and-drop**.

### Recommended locations

Adopt a `src/modules/widgets/` feature module (see `CODEBASE_AUDIT.md §6`):

| Concern | Location | Shape |
|---|---|---|
| Widget registry | `src/modules/widgets/registry.ts` | `Map<widgetType, WidgetDefinition>`; async-loads each definition |
| Widget definitions | `src/modules/widgets/definitions/<Name>/index.ts` (+ `Widget.vue`, `Settings.vue`) | one folder per widget type |
| Widget definition type | `src/modules/widgets/types.ts` | `WidgetDefinition`, `WidgetInstance`, `WidgetLayout` |
| Widget instances | Pinia `src/stores/widgets.store.ts` (persisted → Supabase table later) | runtime data, not files |
| Desktop layouts | store field + DB `widget_layouts` row, `breakpoint = 'desktop'` | grid positions |
| Mobile layouts | same table, `breakpoint = 'mobile'` | separate ordering/stacking |
| Widget settings UI | per-widget `Settings.vue` + shared `components/WidgetSettingsDialog.vue` | dialog built on `AppCard`/`AppButton` |
| Widget permissions | `src/modules/widgets/permissions.ts` | maps widget type → required integrations/OAuth scopes |
| Loading & error states | `src/modules/widgets/components/WidgetBoundary.vue` | `<Suspense>` + `onErrorCaptured`; reuse `AppSkeleton`/`AppEmptyState` |
| Drag-and-drop | `src/modules/widgets/composables/useWidgetDnd.ts` + `WidgetGrid.vue` | wraps DnD library or native pointer handling |
| Canvas page | `src/pages/DashboardPage.vue` (new) or later fold into `HomePage.vue` | **coordinate before touching `HomePage.vue`** |

### Design guidance

- **Registry is the seam.** Everything else (canvas, settings, permissions) references widgets only through the registry, so widgets can be added without touching the engine. Each entry lazy-loads its `Widget.vue` via `defineAsyncComponent` so widgets are separate chunks.
- **Data model:** a `WidgetInstance` is `{ id, type, settings, permissions-granted }`; a `WidgetLayout` is `{ instanceId, breakpoint, x, y, w, h }`. Persist to `localStorage` first (fast path, no auth dependency), migrate to a Supabase `widget_layouts` table (RLS) once auth is wired.
- **Permissions:** a widget declares required integrations (e.g. Gmail-readonly). The canvas renders a "Connect Gmail" empty-state instead of the widget until the integration is connected — this keeps Google-dependent widgets from crashing before OAuth exists.
- **Build the static renderer before DnD.** Render from stored layout with no drag first; add DnD/resize as a later, isolated task (that's where the one new dependency enters). See `FIRST_IMPLEMENTATION_TASKS.md`.

---

## 2. Google integration readiness

Nothing Google exists yet. All four Google features (Gmail, YouTube, Search Console) share one OAuth foundation.

### 2.1 Two distinct Google concerns — do not conflate them

1. **Sign-in (authentication).** Supabase has a native Google auth provider. It signs a user in and can return a `provider_token`/`provider_refresh_token`, but Supabase **does not store or refresh** the provider token, and sign-in scopes are meant to be minimal. Use this only for login, if at all.
2. **API access (authorization).** Gmail/YouTube/Search Console need **offline access** (a long-lived refresh token), **incremental authorization** (add scopes as features are enabled), and **server-side token refresh**. This requires **your own OAuth client + your own token storage**, independent of Supabase login.

Treat these as separate systems. Login gives you a Supabase user; the Google-API connection is a separate "connect account" action stored per user.

### 2.2 Required Google Cloud setup (when approved)

- A Google Cloud project.
- **OAuth consent screen** configured (External; app name, support email, scopes, authorized domains). Personal use can stay in **Testing** mode.
- **OAuth 2.0 Client ID** (Web application) with authorized redirect URIs.
- Enable the APIs per feature: **Gmail API**, **YouTube Data API v3**, **Search Console API** (`searchconsole.googleapis.com`).
- (YouTube public data / embeds only) optionally an **API key**, referrer-restricted.

### 2.3 OAuth redirect flow (Authorization Code + PKCE)

1. Frontend starts the flow → redirects to Google's consent URL with `access_type=offline`, `prompt=consent`, PKCE `code_challenge`, and the minimum scopes for the feature being enabled.
2. Google redirects back to a **fixed redirect URI**. Because the app uses **hash router mode**, prefer redirecting to a Supabase **Edge Function** endpoint (a clean `https://.../functions/v1/google-oauth-callback` URL) rather than a hash route.
3. The Edge Function exchanges `code` + PKCE `verifier` + **client secret** for tokens, then stores the **refresh token** (encrypted) and returns control to the app.
4. All subsequent Google API calls are **proxied through Edge Functions**, which refresh the access token server-side as needed. The client never holds Google tokens.

### 2.4 Responsibilities split

| Responsibility | Frontend (SPA) | Edge Function (server) |
|---|---|---|
| Start OAuth (build consent URL, PKCE challenge) | ✅ | — |
| Hold client secret | ❌ never | ✅ |
| Code→token exchange | ❌ | ✅ |
| Store refresh token (encrypted) | ❌ | ✅ (Supabase, RLS/Vault) |
| Refresh access token | ❌ | ✅ |
| Call Gmail / YouTube / Search Console APIs | ❌ (proxy) | ✅ |
| Render data, embeds, UI | ✅ | — |
| YouTube **IFrame** embed of public videos | ✅ (no token) | — |
| Disconnect / revoke | trigger ✅ | execute revoke + delete ✅ |

### 2.5 Credentials that MUST stay server-side

`GOOGLE_CLIENT_SECRET`, the refresh tokens, the Supabase **service-role key**, and any token-encryption key. Only the Supabase URL, anon key, `GOOGLE_CLIENT_ID` (public by design), and a referrer-restricted YouTube API key may live client-side.

### 2.6 Environment variables eventually needed

**Client (`VITE_`, public):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (exist today), later `VITE_GOOGLE_CLIENT_ID`, optionally `VITE_YOUTUBE_API_KEY`.

**Edge Function secrets (never `VITE_`, set via `supabase secrets set`):** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `TOKEN_ENCRYPTION_KEY`, and (auto-injected) `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`. Optionally `SEARCH_CONSOLE_SITE_URL`.

### 2.7 Minimum OAuth scopes (per feature)

Request incrementally — only when a feature is turned on, never all upfront.

| Feature | Minimum scope | Sensitivity |
|---|---|---|
| Gmail (read) | `gmail.readonly` (or narrower `gmail.metadata` if headers-only) | **Restricted** |
| Gmail (labels only) | `gmail.labels` | Restricted |
| YouTube (user's own data) | `youtube.readonly` | Sensitive |
| YouTube (public search/embed) | none (API key or IFrame) | — |
| Search Console | `webmasters.readonly` | Sensitive |
| Basic identity | `openid email profile` | Non-sensitive |

### 2.8 Verification vs. no-approval

- **Needs Google verification (for public/production use):** any **sensitive** scope (YouTube, Search Console) triggers the verification/brand-review process; **restricted** scopes (Gmail read) additionally require an annual third-party security assessment (CASA).
- **Works without verification (personal use):** keep the OAuth app in **Testing** mode with your own Google account as a **test user**. Caveat to verify at build time: in Testing mode, refresh tokens for sensitive/restricted scopes **expire after 7 days**, so a personal app must handle periodic re-consent, or you must complete verification for durable tokens.
- **No API approval at all:** YouTube **IFrame embeds** of public videos, and public YouTube **search/metadata** via an API key (public data only). These can ship first, with zero OAuth.

**Sequencing recommendation:** ship YouTube-embed and public-search widgets first (no OAuth), then build the OAuth/Edge-Function foundation, then layer Gmail/YouTube-account/Search-Console on top.

---

## 3. Khmer calendar readiness

`CalendarPage.vue` is a placeholder. A correct Cambodian calendar has three **strictly separated** data sources; conflating them is the classic failure mode.

### 3.1 The three layers (keep separate)

1. **Calculated lunar dates (algorithmic, no stored data).** Khmer lunar calendar (Chhankitek / សុរិយាត្រ tradition): waxing (កើត) and waning (រោច) days, 15 each; lunar month names; leap month (អធិកមាស / *adhikameas*) and leap day (ចន្ទ្រាធិមាស / *chantreathimeas*) rules; **Buddhist Era** year (commonly Gregorian + 543, but the BE rollover point depends on convention — verify). This is pure computation and can run client-side in a composable (`src/modules/calendar-khmer/lunar.ts`). It must be validated against a trusted reference.
2. **Official yearly holiday data (curated, verified per year).** Cambodian **public holidays** are set by annual government sub-decree and **change year to year** (the official count has been revised in recent years). Some holidays are fixed Gregorian (e.g. Independence Day 9 Nov), others are lunar-derived (Visak Bochea, Pchum Ben, Meak Bochea, Water Festival) and must be recomputed or re-sourced each year. Store as a versioned dataset (`src/modules/calendar-khmer/holidays/<year>.ts` or a Supabase `holidays` table), never as code constants baked once.
3. **User-created events (Supabase, RLS).** Personal calendar events in their own table (fits the existing schema style: `user_id`, RLS, `item_tags`/`item_links` for cross-linking to notes/tasks).

### 3.2 Specific events to model

- **Khmer New Year (Choul Chnam Thmey)** — mid-April, 3 days; the exact start (Moha Sangkran) is by traditional calculation, not a fixed Gregorian date.
- **Pchum Ben** — lunar (culminates on the 15th waning day of the 10th month); Gregorian date shifts yearly; the surrounding 15-day observance matters.
- **Water Festival (Bon Om Touk)** — lunar (full moon of Kadeuk), ~November, 3 days.
- **Buddhist holy days (Thngai Sil / ថ្ងៃសីល)** — the 8th and 15th waxing/waning days each lunar month; derivable from layer 1.
- **Buddhist Era dates & waxing/waning day labels** — layer 1.

### 3.3 What MUST be verified against reliable Cambodian sources before implementation

- The **lunar algorithm's correctness** — validate output against an authoritative reference (e.g. the Buddhist Institute of Cambodia's calendar, or a well-regarded existing Chhankitek implementation) across several years including a leap month/leap day year.
- The **official public-holiday list for each target year** — from the Royal Government sub-decree / ministry announcement, because the list and dates are revised annually.
- **Holiday names** in Khmer and English, and which are lunar vs. fixed.
- The **BE-year rollover convention** to use, and the leap-year (*adhikameas*/*chantreathimeas*) rules for the years in scope.

Do not hardcode any of the above from memory; treat holiday data as reference material to be re-verified yearly. Dependency options for the lunar math are compared in `DEPENDENCY_AUDIT.md`.
