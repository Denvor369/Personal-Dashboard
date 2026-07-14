# Technical Architecture

Status: proposed architecture; no implementation implied  
Last reviewed: 2026-07-13

## 1. Architecture goals

- Keep Quasar/Vue as one application, not a collection of micro-frontends.
- Lazy-load module routes and heavy integration code.
- Keep personal Supabase records separate from cached provider data.
- Use Pinia for client/UI state and TanStack Query for asynchronous server state.
- Let modules communicate through stable IDs, shared records, router links, and query invalidation rather than importing each other’s stores.
- Put secrets, OAuth exchanges, provider API calls, and scheduled sync work behind Supabase Edge Functions or an equivalent trusted server.

## Current stack contract

| Technology         | Architectural role                                                                 |
| ------------------ | ---------------------------------------------------------------------------------- |
| Quasar Framework   | Responsive components, layouts, PWA and Capacitor build modes                      |
| Vue 3 + TypeScript | Module UI and strict domain contracts using Composition API                        |
| Vite               | Development and code-split production bundling                                     |
| Vue Router         | Lazy module boundaries and deep links                                              |
| Pinia              | Small global client-state stores                                                   |
| TanStack Query     | Server-state cache, pagination, mutations and invalidation                         |
| Supabase           | Auth, Postgres, RLS, Realtime, Edge Functions and scheduled work                   |
| PWA                | Primary installable web experience and resilient application shell                 |
| Capacitor          | Android/iOS packaging and later platform adapters, not a separate app architecture |

Keep domain logic platform-neutral. Any native capability should sit behind a small adapter only when the web API cannot meet a proven Android/iOS requirement.

## 2. Runtime layers

| Layer               | Responsibility                                             | Preferred tools                                                               |
| ------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Application shell   | Navigation, theme, responsive layout, global player outlet | Quasar, Vue Router, Pinia                                                     |
| Module UI           | Pages and domain components                                | Vue `<script setup lang="ts">`, Quasar                                        |
| Widget shell        | Layout, states, refresh, settings, module link             | Dashboard module                                                              |
| Client state        | Ephemeral UI and durable local preferences                 | Pinia; local storage only for non-sensitive preferences                       |
| Server state        | Fetching, caching, pagination, mutation status             | TanStack Query                                                                |
| Personal data       | User-owned records and realtime changes                    | Supabase Postgres, RLS, Realtime                                              |
| Integration gateway | OAuth and external API calls                               | Supabase Edge Functions                                                       |
| Background sync     | Scheduled and queued provider refresh                      | Supabase Cron, Edge Functions, `sync_jobs`                                    |
| Secure secrets      | Provider client secret and refresh-token material          | Function secrets and/or a private encrypted store inaccessible to the browser |

Pinia must not duplicate server collections already managed by TanStack Query. A Pinia store is appropriate for theme, navigation, active player state, transient filters shared across pages, and an authenticated session summary.

## 3. Module folder structure

Add folders only when a module needs them. An empty module should not contain eight empty directories.

```text
src/
├── app/
│   ├── navigation/
│   └── providers/
├── modules/
│   ├── dashboard/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── registry/
│   │   ├── services/
│   │   ├── types/
│   │   └── routes.ts
│   ├── tasks/
│   ├── notes/
│   ├── projects/
│   ├── calendar/
│   ├── gmail/
│   ├── youtube/
│   ├── search-console/
│   ├── khmer-calendar/
│   ├── notifications/
│   └── settings/
├── shared/
│   ├── components/
│   ├── composables/
│   ├── services/
│   ├── types/
│   └── utils/
├── boot/
├── layouts/
├── router/
└── css/
```

### Module contents

Use these locations when required:

```text
modules/<module>/
├── components/  # domain-specific visual components
├── pages/       # route-level components
├── services/    # Supabase or integration-gateway calls
├── composables/ # Vue/TanStack Query orchestration
├── stores/      # client state only when genuinely shared
├── types/       # public and internal domain types
├── utils/       # pure domain helpers
└── routes.ts    # lazy-loaded route records
```

The module root should expose only its public boundary through an `index.ts` after a second consumer exists. Avoid barrel files that re-export every internal component.

### Recommended ownership

| Module         | Initial technical responsibility                                                            |
| -------------- | ------------------------------------------------------------------------------------------- |
| dashboard      | Widget registry, instances, layouts, widget shell and customization mode                    |
| tasks          | Task queries/mutations, task views and task widgets                                         |
| notes          | Note queries/mutations, tags, editor and note widgets                                       |
| projects       | Project queries/mutations and association views                                             |
| calendar       | Personal events, reminders and standard calendar views                                      |
| gmail          | Integration-gateway client, cached thread/message queries and Gmail widgets                 |
| youtube        | Global player store, IFrame adapter, saved local video records and optional Data API client |
| search-console | Cached analytics queries, comparison transforms and widgets                                 |
| khmer-calendar | Lunar engine adapter, verification metadata, holiday queries and date presentation          |
| notifications  | Notification list, read state, preferences and realtime subscription                        |
| settings       | User settings and connected-service management UI                                           |

## 4. Module communication rules

1. Share record IDs, not mutable module objects.
2. Link between modules through named routes and query parameters.
3. A mutation invalidates documented TanStack Query keys; it does not call another module’s component.
4. Cross-module relationships belong in database foreign keys or join tables, not duplicated JSON snapshots.
5. Notifications receive domain-neutral events such as `{ type, actorId, entityType, entityId }`.
6. Dashboard widgets import a module’s public query/composable, never its page component or Pinia internals.
7. The global YouTube player is a shell service because playback must survive route changes; video discovery remains in the YouTube module.
8. Use a small typed event channel only for ephemeral shell events such as `open-quick-capture`. Persistent state must go through the database.

Do not introduce a general event bus, dependency-injection container, or plugin SDK in the MVP.

## 5. Widget architecture

### Domain types

```ts
export type ModuleId =
  | 'dashboard'
  | 'tasks'
  | 'notes'
  | 'projects'
  | 'calendar'
  | 'gmail'
  | 'youtube'
  | 'search-console'
  | 'khmer-calendar'
  | 'notifications';

export type WidgetSize = 'small' | 'medium' | 'large';
export type WidgetDevice = 'desktop' | 'mobile';
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface WidgetSettings {
  [key: string]: JsonValue;
}

export interface WidgetPermission {
  kind: 'module' | 'integration' | 'oauth-scope';
  value: string;
  optional?: boolean;
}

export interface WidgetDefinition<TSettings extends WidgetSettings = WidgetSettings> {
  type: string;
  moduleId: ModuleId;
  title: string;
  description: string;
  icon: string;
  componentKey: string;
  supportedSizes: readonly WidgetSize[];
  defaultSize: WidgetSize;
  defaultSettings: TSettings;
  permissions: readonly WidgetPermission[];
  defaultRefreshSeconds?: number;
  moduleRoute: string;
}

export interface WidgetInstance<TSettings extends WidgetSettings = WidgetSettings> {
  id: string;
  userId: string;
  widgetType: string;
  titleOverride: string | null;
  visible: boolean;
  settings: TSettings;
  createdAt: string;
  updatedAt: string;
}

export interface WidgetLayoutItem {
  widgetInstanceId: string;
  size: WidgetSize;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetLayout {
  id: string;
  userId: string;
  dashboardKey: 'home';
  device: WidgetDevice;
  version: number;
  items: WidgetLayoutItem[];
  updatedAt: string;
}

export type WidgetDataPhase = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface WidgetDataStatus {
  phase: WidgetDataPhase;
  stale: boolean;
  refreshing: boolean;
  lastUpdatedAt: string | null;
  errorMessage: string | null;
}
```

The runtime registry maps `componentKey` to a lazy Vue component. Database rows store only serializable identifiers and settings.

### Widget shell contract

Every widget is rendered inside one shell that owns:

- title and icon
- loading skeleton
- error and retry control
- empty state and primary action
- stale/refreshing indicator
- manual refresh with cooldown
- open-module control
- settings control
- customization handles
- permission-required state

Domain widgets render successful content and expose refresh/query metadata. They do not reimplement shell states.

### Layout persistence

Store desktop and mobile as separate `dashboard_layouts` rows:

```text
(user_id, dashboard_key='home', device='desktop')
(user_id, dashboard_key='home', device='mobile')
```

Desktop uses a multi-column grid and all three sizes. Mobile uses one logical column; size maps to vertical density rather than a squeezed desktop width. A desktop reorder never silently changes mobile order.

Save a full ordered `items` JSON document atomically with an incremented `version`. Debounce drag/resize saves. If the version changed on another device, accept the newest complete layout for the same device class and notify the user only if customization mode is open.

### Widget refresh behavior

- Hidden widgets do not mount or fetch.
- Widgets share query keys with their full module page where the payload is identical.
- Manual refresh calls `invalidateQueries`; it does not bypass the integration gateway.
- Widget-specific errors do not trigger a global error page.
- Auto-refresh pauses when the app is backgrounded unless a native requirement is later proven.

## 6. Routing and code splitting

- Each module exports lazy route records.
- Keep Home’s default widgets in the initial route chunk only if they are visible by default.
- Lazy-load Gmail, Search Console, calendar engines, rich editors, and customization controls.
- Load integration widgets only after connection and visibility checks.
- Prefetch a module page on deliberate hover/focus or after its widget becomes visible; do not prefetch every module at startup.
- Keep the persistent YouTube player shell small; load the IFrame API only after the user opens or resumes a video.

## 7. Realtime and synchronization

### Use realtime

| Data                     | Event handling                                                              |
| ------------------------ | --------------------------------------------------------------------------- |
| Tasks                    | Patch/invalidate affected task lists and task widgets.                      |
| Notes                    | Invalidate list/detail queries; avoid overwriting an actively edited draft. |
| Dashboard layouts        | Refresh only the matching desktop/mobile layout.                            |
| Notifications            | Insert/update the notification cache and unread count.                      |
| Personal calendar events | Patch the active date range.                                                |

For an initial personal deployment, Supabase Postgres Changes is acceptable. If subscription volume grows, use private Broadcast channels with authorization; Supabase recommends Broadcast for better scalability and security.

### Do not use realtime

- Gmail message history
- Search Console metrics
- Khmer holiday reference data
- YouTube search results
- Completed sync-job history

These sources change through external providers or scheduled imports. Update them through background sync and TanStack Query invalidation.

### External synchronization flow

```text
Cron/manual trigger
  → create or claim sync_job
  → Edge Function resolves secure account token
  → provider API request with pagination/rate limits
  → normalize/upsert integration_cache or domain cache
  → mark sync_job result
  → notify client through cache invalidation or a small sync-status event
```

Jobs must be idempotent by `(user_id, account_id, job_type, cursor/window)` and use bounded retries with exponential backoff.

## 8. Performance rules

### Requests and caching

- Define query-key factories per module.
- Give every provider query an explicit `staleTime`; never rely on a zero default for dashboards.
- Deduplicate identical requests through TanStack Query and server-side cache keys.
- Invalidate the narrowest query set after mutations.
- Paginate Tasks, Notes, Gmail threads, YouTube search, and detailed Search Console rows.
- Use cursor pagination when the provider exposes a cursor; do not translate it into unreliable page numbers.
- Cancel obsolete searches and debounce user input.

### Rendering

- Render widget skeletons independently.
- Virtualize only lists proven to be large; pagination is the first choice.
- Reserve media dimensions to prevent layout shift.
- Prefer provider thumbnails at the displayed size; avoid downloading original images for cards.
- Keep SVG/CSS charts for small dashboard summaries.
- Avoid mounting hidden tabs, hidden widgets, or the YouTube API before use.

### Mobile

- Keep the initial Home payload small and prioritize the first three widgets.
- Use one-column layout ordering and fewer default widgets.
- Pause expensive polling when backgrounded.
- Treat unreliable connectivity as normal: keep prior successful data with a stale label.
- Avoid large attachment downloads without explicit user action.

### Supabase egress control

- Select explicit columns rather than `*` on list queries.
- Request only visible date ranges and pages.
- Store thumbnails/derived summaries instead of repeatedly transferring provider payloads.
- Set retention rules for integration caches and sync logs.
- Use realtime only on narrow user-owned tables and unsubscribe on logout/unmount.

## 9. Security rules

1. Enable RLS on every exposed table before frontend access.
2. Default to `auth.uid() = user_id`; validate ownership through parent records for child tables.
3. Never place Google client secrets, service-role keys, refresh tokens, or provider access tokens in Vite variables, Pinia, local storage, IndexedDB, logs, or URL parameters.
4. Perform OAuth authorization-code exchange, token refresh, revocation, and provider calls in Edge Functions.
5. Validate OAuth `state`, exact redirect URI, account identity, requested module, and granted scopes.
6. Request the minimum scope and use incremental authorization.
7. Encrypt provider token material at rest or store it through a managed secret facility; expose only an opaque token handle to application tables.
8. Validate all Edge Function payloads and provider responses.
9. Rate-limit by user, connected account, function, and provider action.
10. Record sensitive actions: connect, scope grant, token refresh failure, send/reply, archive, disconnect, and revoke.
11. Disconnect must stop jobs, delete cached sensitive data according to policy, remove token material, and attempt provider revocation.
12. Keep browser environment variables limited to public configuration such as Supabase URL and publishable/anon key.

## 10. Error model and observability

Use stable error categories across integrations:

- `not_connected`
- `permission_required`
- `token_expired`
- `provider_rate_limited`
- `provider_unavailable`
- `sync_failed`
- `validation_failed`
- `unknown`

Show safe user messages while logging provider request IDs, status codes, account IDs, and job IDs server-side. Never log tokens, authorization codes, full email bodies, or attachment content.

## 11. Decision log

| Decision                                | Reason                                               | Revisit when                                                      |
| --------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| One Vue application with module folders | Lowest operational and cognitive cost                | Independent release teams or deployments exist.                   |
| JSON layout document per device         | Atomic drag/resize save and simple reads             | Collaborative layout editing or layout-item analytics are needed. |
| Edge Functions as integration gateway   | Fits current Supabase stack and protects secrets     | Provider workloads exceed function/runtime limits.                |
| TanStack Query for server state         | Existing stack already handles caching/deduplication | No planned trigger.                                               |
| No plugin SDK                           | No third-party widget requirement                    | A real external extension use case appears.                       |

## Sources

- [Supabase: securing data and using Edge Functions](https://supabase.com/docs/guides/database/secure-data)
- [Supabase: database change subscriptions](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)
- [Supabase: scheduled Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions)
