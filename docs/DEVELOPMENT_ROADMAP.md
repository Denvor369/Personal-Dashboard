# Development Roadmap

Status: proposed delivery sequence  
Last reviewed: 2026-07-13

## Delivery rules

- Each phase must leave the application deployable.
- Build one thin vertical slice before generalizing a shared system.
- Do not start the next provider integration while the current one lacks disconnect, error, and rate-limit handling.
- Database work is not complete until RLS and policy tests exist.
- Mobile acceptance criteria are part of every phase, not a final cleanup.
- Feature flags hide incomplete integration modules.

## Phase 1 — Foundation and customizable Home

### Goals

Make the existing dashboard a stable shell and prove that widgets can be configured without turning Home into a page builder platform.

### Features

- Audit and consolidate current design tokens/components
- Stable desktop and mobile navigation
- Module route conventions and lazy route loading
- Widget TypeScript contracts and runtime registry
- Shared widget shell with loading, error, empty, stale, refresh, settings, and module-link states
- Widget instances and versioned desktop/mobile layouts
- Customization mode: show/hide, reorder, supported resizing, reset default
- Theme, time-zone, locale, and basic dashboard settings
- Responsive and accessibility checks

### Dependencies

- Existing Quasar/Vue/Pinia/TanStack Query foundation
- Authenticated Supabase session for cross-device persistence
- `dashboard_widgets`, `dashboard_layouts`, `profiles`, and `user_settings` schema with RLS

### Risks

- Choosing a drag/resize library before requirements are proven
- Trying to make every existing card configurable at once
- Desktop layout decisions leaking into mobile
- Excessive layout writes during drag operations

### Completion criteria

- One existing widget is converted end-to-end before the remaining default widgets.
- All default widgets render through the shared shell.
- Layouts persist separately for desktop and mobile.
- Hidden widgets do not fetch.
- One widget failure does not break Home.
- Keyboard users can enter/exit customization and reorder through an accessible alternative.
- TypeScript, lint, web/PWA builds, and common viewport checks pass.

## Phase 2 — Core personal modules

### Goals

Deliver a useful Personal Operating System without external accounts.

### Features

- Tasks: inbox, status, priority, due dates, project association
- Notes: capture, edit, organization, basic full-text search
- Projects: status, dates, linked tasks/notes, progress
- Standard calendar: personal events, reminders, date-range views
- Notifications: inbox, unread count, read/dismiss and reminder delivery
- Quick capture for task, note, and event
- Home widgets backed by real module data
- Owner-scoped realtime updates

### Dependencies

- Phase 1 widget shell and module boundaries
- RLS-backed `projects`, `tasks`, `notes`, `calendar_events`, `notifications`
- Query-key conventions and realtime-to-query invalidation helper

### Risks

- Building advanced recurrence, backlinks, or task automation too early
- Realtime overwriting active drafts
- Unbounded note/event list queries
- Tight coupling between Projects and child module stores

### Completion criteria

- User can plan a project, create linked tasks/notes/events, and see today’s work on Home.
- Personal records are isolated by tested RLS policies.
- Lists paginate and dashboard queries select bounded fields.
- Realtime updates another active session without duplicate records.
- Offline/network failures preserve prior data and show clear stale/error states.

## Phase 3 — Khmer calendar and Cambodian holidays

### Goals

Add culturally relevant calendar context without presenting unverified calculations as fact.

### Features

- Gregorian and Khmer date presentation
- Lunar month, waxing/waning day, Buddhist Era year
- Buddhist holy days only after verification
- Verified annual Cambodian public holiday dataset
- Khmer New Year, Pchum Ben, Water Festival, and traditional festival presentation
- Combined calendar view with personal events
- Source and verification metadata in settings/detail view

### Dependencies

- Trusted lunar algorithm/library candidate
- Golden verification dataset and Cambodian source review
- `khmer_holidays` table with admin-only import and public verified reads
- Standard calendar from Phase 2

### Risks

- Incorrect lunar results near leap/month/year boundaries
- Treating cultural dates and government days off as the same dataset
- Government schedule corrections after initial publication
- Missing Khmer-language review

### Completion criteria

- Algorithm results pass the agreed verification dataset.
- Known limitations and algorithm version are documented.
- Only verified holiday rows reach normal users.
- A new yearly holiday schedule can be imported and approved without a frontend release.
- Official, derived, and personal events are visually distinguishable.

## Phase 4 — Google connection and Gmail read-only MVP

### Goals

Establish secure, reusable Google account infrastructure and deliver Gmail value without mail mutation.

### Features

- Connected Services settings area
- Google OAuth web-server flow through Edge Functions
- Secure token storage and refresh
- Granted-scope display, last sync, reauthorize, disconnect, revoke
- Gmail inbox summary widget
- Paginated inbox, unread/important filters, search, thread view
- Attachment metadata and explicit download
- Account-specific cache and sync jobs

### Dependencies

- Google Cloud project, consent screen, redirect URIs, Gmail API
- Edge Function secrets and private token storage
- Integration tables, scheduler, rate limiting, audit logging
- Google test users and verification plan

### Risks

- Gmail restricted-scope verification and possible security-assessment cost
- Sensitive mail cached longer than necessary
- Refresh-token loss/revocation
- Attachment size/content security

### Completion criteria

- No Google secret/token reaches browser storage or logs.
- Only `gmail.readonly` is requested for Gmail MVP.
- Inbox widget uses cache and never calls Gmail per render.
- Pagination, stale state, cooldown, retry, reauth, disconnect, and cache purge are tested.
- Provider outage leaves the rest of the application usable.

## Phase 5 — YouTube player and saved content

### Goals

Provide focused media playback without requiring YouTube account permissions for the first release.

### Features

- Paste/validate YouTube URL
- Embedded IFrame player
- Persistent mini-player across SPA navigation
- Local saved videos, playlists, and Watch Later
- Resume position
- Picture-in-picture where supported
- Optional quota-controlled public video search after the player MVP

### Dependencies

- Application-shell player outlet and small Pinia player store
- Local saved-content tables or scoped generic records
- YouTube IFrame API; Data API and server key only for search

### Risks

- Browser/Capacitor autoplay and background-media differences
- Picture-in-picture limitations in cross-origin embeds/WebViews
- Data API quota exhaustion from search-as-you-type
- Multiple player instances fighting for state

### Completion criteria

- One player continues across internal route changes without duplicate audio.
- Saved content works without Google OAuth.
- Playback position writes are throttled.
- Unsupported PiP/autoplay behavior degrades clearly.
- If search is enabled, it is debounced, cached, paginated, and budgeted server-side.

## Phase 6 — Search Console analytics

### Goals

Add useful search-performance insight with scheduled, cache-first data access.

### Features

- Separate Search Console permission grant
- Connected properties and selector
- Clicks, impressions, CTR, average position
- Top queries/pages, countries, devices
- 7/28/90-day ranges and prior-period comparisons
- Dashboard widget
- Scheduled cache refresh and manual refresh cooldown
- Initial performance alerts

### Dependencies

- Phase 4 Google connection foundation
- Search Console API enabled and `webmasters.readonly` grant
- Integration cache and sync-job scheduler
- Notification module for alerts

### Risks

- Re-querying expensive dimensions/ranges
- Misrepresenting incomplete recent data
- Too many cache-key combinations
- Alert noise from normal variance

### Completion criteria

- No Search Console request originates from component render.
- Current summaries refresh on a 6–12 hour schedule; finalized ranges reuse cache.
- Incomplete data is labeled.
- Comparisons use consistent windows and time-zone semantics.
- Alerts run after successful sync and include a cooldown/dedupe key.

## Phase 7 — Advanced integrations and native polish

### Goals

Expand only after read-only integrations and core modules are stable.

### Features

- Gmail drafts, replies, sending, archive, labels, read state
- Incremental Gmail permissions
- Multiple Google accounts and per-module default account
- Unified search across local modules and selected provider caches
- Android/iOS navigation, safe-area, deep-link, media, and notification improvements
- Optional YouTube account import/write features
- Better background sync coordination

### Dependencies

- Provider approvals for expanded scopes
- Mature audit log, revocation, rate limiting, and error handling
- Search index design and privacy decisions
- Capacitor platform test devices and signing setup

### Risks

- Irreversible or accidental mail actions
- Scope creep during reauthorization
- Cross-account data leakage
- Native background constraints and battery use
- Unified search exposing sensitive provider content

### Completion criteria

- Every Gmail mutation has confirmation/undo or safe rollback semantics.
- Expanded scopes are requested at the action that needs them.
- Account ID is explicit in every integration request/cache/query.
- Disconnect/revoke removes the correct account without affecting others.
- Unified search honors permissions and retention rules.
- Android and iOS release checklists pass on physical devices.

## Recommended milestones

| Milestone                       | Phases | Product outcome                                                    |
| ------------------------------- | ------ | ------------------------------------------------------------------ |
| M1: Customizable shell          | 1      | Stable Personal OS frame and widget customization                  |
| M2: Useful without integrations | 2      | Daily planning, knowledge, projects, calendar and notifications    |
| M3: Cambodian calendar context  | 3      | Verified local cultural/calendar value                             |
| M4: Secure connected services   | 4      | Reusable Google OAuth and Gmail read-only                          |
| M5: Media and analytics         | 5–6    | YouTube playback and Search Console insight                        |
| M6: Power-user release          | 7      | Mutating integrations, multiple accounts, search and native polish |

## First development task after planning

Create the widget domain types, a static registry, and the shared widget shell, then adapt exactly one existing Home card as a proof slice. Include its desktop/mobile default layout, loading/error/empty states, and a non-fetching hidden state. Do not add drag-and-drop or database persistence until that slice proves the contract.

This is the smallest task that tests the central architecture without committing the project to a grid library or premature abstractions.
