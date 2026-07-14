# Integrations Plan

Status: product and security plan; no provider connection is implemented by this document  
Last reviewed: 2026-07-13

## 1. Integration principles

- External services are optional modules, not application startup dependencies.
- The frontend never receives a Google client secret or refresh token.
- The browser calls the application’s integration gateway, not Google APIs directly for authenticated features.
- Request scopes incrementally and separately by module where possible.
- Show the user what is connected, what is permitted, when it last synced, and how to disconnect.
- Cache provider responses and refresh them on a schedule; component render is never a sync trigger.
- Design for one Google account in the first UI while using account IDs throughout the schema.

## 2. Connected Services settings

### Screen structure

`Settings → Connected Services` contains one card per service:

- service name and icon
- connection state
- connected Google email/avatar
- enabled modules
- granted permissions in plain language
- last successful synchronization
- current sync activity
- last connection/sync error with recovery action
- Connect, Reauthorize, Sync now, and Disconnect controls

A permission details view maps every plain-language permission to its exact OAuth scope and the module that requested it.

### States

```text
not_connected
connecting
active
syncing
permission_required
reauth_required
provider_error
disconnecting
```

The UI must distinguish an expired/revoked token from a provider outage and from a missing module-specific scope.

### Multiple-account preparation

- Every integration request carries `connectedAccountId`.
- Never use email as the primary key.
- Store a default account per module in `user_settings` only after multiple accounts are exposed.
- Keep caches, jobs, permissions, and audit events account-scoped.
- Do not build account switching until the single-account flows are reliable.

## 3. Secure Google OAuth flow

Use the Google OAuth web-server authorization-code flow behind Supabase Edge Functions or an equivalent trusted server.

### Connect

1. Authenticated client requests `integration-google-authorize` with the desired module and return route.
2. Edge Function validates the Supabase user and permitted module.
3. Function creates a short-lived, single-use state record bound to user, module, redirect URI, PKCE verifier where supported, and expiry.
4. Function returns the Google authorization URL using only the module’s minimum scopes.
5. Google redirects to a server callback, not an application page that exposes the authorization code to unrelated resources.
6. Callback validates state, expiry, redirect URI, and expected user context.
7. Server exchanges the code using confidential credentials and requests offline access only when background sync is required.
8. Server obtains Google identity, upserts safe account metadata, stores token material in a private encrypted store, and records actual granted scopes.
9. Server redirects to a clean Settings route without codes or tokens.

Google recommends validating OAuth state, securing client credentials, and handling refresh-token invalidation. Offline access is what enables background refresh without repeated consent.

### Token storage

- Keep the Google client ID/secret in Edge Function secrets.
- Keep refresh tokens encrypted in a private schema or managed secret store unavailable to the Data API and Realtime.
- `connected_accounts.token_handle` is an opaque reference only.
- Use short-lived access tokens in function memory; do not persist them unless a proven performance need exists.
- Redact authorization codes and tokens from logs, errors, traces, and analytics.
- Rotate encryption keys and provider credentials with a documented procedure.

### Incremental permissions

Connect identity first with `openid`, `email`, and `profile`. Request additional scopes only when a module is enabled:

| Module capability     | Recommended initial scope                             | Classification/impact                                                            |
| --------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| Google identity       | `openid email profile`                                | Basic identity consent.                                                          |
| Gmail read-only MVP   | `https://www.googleapis.com/auth/gmail.readonly`      | Restricted Gmail scope; verification requirements apply outside limited testing. |
| Gmail archive/labels  | `https://www.googleapis.com/auth/gmail.modify`        | Restricted; request only in advanced Gmail phase.                                |
| Gmail send            | `https://www.googleapis.com/auth/gmail.send`          | Sensitive; request at the first send action.                                     |
| Gmail drafts/compose  | `https://www.googleapis.com/auth/gmail.compose`       | Restricted; advanced phase.                                                      |
| Search Console read   | `https://www.googleapis.com/auth/webmasters.readonly` | Read-only Search Console access.                                                 |
| YouTube account read  | `https://www.googleapis.com/auth/youtube.readonly`    | Only if importing the user’s YouTube account data.                               |
| YouTube account write | Provider-documented write scope                       | Delay; not needed for local saved videos/playlists.                              |

Gmail and Search Console should have separate enable/consent actions even if they use the same Google identity. Do not request a combined scope bundle during initial account connection.

### Disconnect

1. Confirm what will stop syncing and what local data will be deleted.
2. Mark the connection disconnecting and prevent new jobs.
3. Cancel queued jobs and wait/expire active jobs safely.
4. Attempt Google token revocation.
5. Delete token material regardless of revocation response.
6. Mark permissions revoked and purge sensitive caches.
7. Retain only minimal sanitized audit metadata if required.
8. Invalidate connected-service and widget queries.

## 4. Gmail module plan

### MVP: read-only

- Connected account status
- Inbox summary widget with unread and important counts
- Paginated inbox thread list
- Unread and Important filters
- Server-backed search using Gmail query syntax where appropriate
- Thread view with sanitized message bodies
- Attachment metadata and explicit download
- Labels displayed read-only
- Stale and last-synced indicators
- Manual refresh with cooldown

The MVP should request `gmail.readonly`; Google currently classifies it as restricted. If restricted Gmail data is stored or transmitted through the server, OAuth verification and potentially a security assessment may be required. Keep cached content minimal and retention short.

### Advanced Gmail

- Create/edit drafts
- Send new messages and replies
- Archive/unarchive
- Apply/remove labels
- Mark read/unread
- Attachment upload/download improvements
- Optimistic actions with rollback
- Multiple account switching
- Push/history synchronization after polling is stable

Request `gmail.modify`, `gmail.compose`, or `gmail.send` only when the matching advanced capability is introduced. Avoid the broad `mail.google.com` scope.

### Data flow and caching

```text
Gmail widget/page
  → TanStack Query
  → integration-gmail Edge Function
  → integration_cache hit if fresh
  → Gmail API only when stale/missing/explicitly refreshed
  → sanitized normalized response
```

Recommended initial policy:

- Inbox counts: stale after 2 minutes; background refresh no more than every 5 minutes while active.
- Thread lists: stale after 2–5 minutes; cache provider `nextPageToken` per query/account.
- Thread detail: stale after 5 minutes; avoid storing full bodies unless needed.
- Search: debounce; cache identical queries briefly; do not prefetch arbitrary pages.
- Attachments: metadata only until download; stream through the trusted gateway with size/type checks.
- Failures: retain prior data with a stale label and account-specific reauthorization action.

Do not poll when the app is backgrounded. A later push/history implementation can schedule targeted sync, but Gmail history is not a Supabase Realtime use case.

## 5. YouTube module plan

### Features requiring only an embedded player

- Paste and parse a supported YouTube URL
- Load a known video ID
- Play/pause/seek and player event handling
- Resume the current local playback session
- Mini-player that remains mounted in the application shell during route changes
- Picture-in-picture only when supported by the browser/platform and allowed by the embedded player
- Locally saved video references and local playlists stored in Supabase

Use the YouTube IFrame Player API for controlled playback. Feature-detect picture-in-picture and provide no guarantee on every browser, iframe policy, or Capacitor WebView.

### Features requiring YouTube Data API

- Search public videos
- Resolve richer video/channel metadata
- Fetch provider playlists
- Import the user’s YouTube account playlists/subscriptions
- Read or mutate provider-side Watch Later/playlists where the API and scopes permit it

Public search requires the Data API and consumes quota even without user OAuth. Route it through a server function with query caching, safe-search policy, pagination tokens, and a daily budget. Google’s API reference documents quota impact and pagination behavior; current quotas must be read from the project’s Google API Console rather than hardcoded into product logic.

### MVP

- URL paste
- Embedded player
- Persistent mini-player within the SPA session
- Local saved videos
- Local playlists
- Local Watch Later list

This MVP does not need YouTube account OAuth. Add Data API search only after quota controls exist.

### Playback architecture

- One player controller/store lives in the application shell.
- Module pages send commands to the controller; they do not mount competing global players.
- Persist video ID and position periodically with a coarse interval and on pause/navigation, not every second.
- Never auto-play with sound on initial app load.
- Capacitor builds must test WebView media policies separately.

## 6. Search Console module plan

### MVP

- Connected properties list
- Property selector
- Clicks, impressions, CTR, and average position
- Top queries and top pages
- Countries and devices
- Date ranges: 7, 28, and 90 days
- Previous-period comparison
- Last-sync and incomplete-data labels

### Later

- Configurable performance alerts
- Query/page drilldowns
- Saved comparisons
- Hourly/fresh-data view where available
- Multiple property dashboard widgets
- Notification rules for significant changes

### Refresh and cache policy

Search Console data is analytical and may be incomplete for recent dates. It must not be requested whenever a component renders.

- Property list: cache 6 hours; refresh after reconnect or explicit action.
- Current 7/28/90-day summaries: background sync every 6–12 hours.
- Finalized historical windows: cache at least 24 hours; older ranges can be retained longer.
- Top queries/pages/countries/devices: cache by account, property, date range, dimensions, filters, and data state.
- Manual refresh: enqueue a sync job with a cooldown; return current cache immediately.
- Comparisons: compute from cached period aggregates where possible.
- Alerts: evaluate after scheduled sync, never in a widget render path.

Google warns that repeatedly querying the same ranges increases load, and page/query dimensions are more expensive. Keep requests bounded, use pagination for detailed rows, and track incomplete data metadata.

Use `webmasters.readonly` unless a future feature genuinely requires write access.

## 7. Khmer lunar calendar and holidays

This module has three independent data sources and must keep them separate.

### A. Lunar date calculation

Responsible for:

- Gregorian-to-Khmer lunar date conversion
- Khmer lunar month
- waxing/waning day
- Buddhist Era year
- Buddhist holy-day derivation when verified

Plan:

1. Define a pure calculation adapter with an algorithm version.
2. Select a documented algorithm or maintained library only after review.
3. Build a trusted verification dataset spanning normal years, leap months/days, boundary dates, major festivals, and dates supplied by Cambodian authoritative calendars.
4. Compare results against at least two trusted Cambodian sources or an approved expert dataset.
5. Record algorithm version, verification source, coverage, and known exceptions.
6. Until validation passes, label output experimental and never claim it is authoritative.

Do not assume a simple Gregorian-year offset fully determines the Khmer Buddhist year at every cultural boundary.

### B. Official yearly public holidays

Responsible for official non-working dates and official names.

- Store rows in `khmer_holidays` by year, version, source URL/document number, and verification status.
- Import through an admin-only script or Edge Function after the Royal Government publishes the yearly schedule.
- Require human review before changing rows to `verified`.
- Keep superseded versions for traceability.
- Client queries verified rows and caches a year at a time.
- Publish yearly updates through data, not a frontend release.

For example, Cambodia’s Ministry of Economy and Finance publishes an official annual holiday calendar, including Khmer New Year, Pchum Ben, and the Water Festival. The ingestion process should prefer the current government document over third-party holiday APIs.

### C. Personal calendar data

Personal events and reminders remain in `calendar_events` with user ownership and realtime updates. The calendar UI merges them with read-only official holidays and derived lunar labels at presentation time.

### Festival handling

- Khmer New Year, Pchum Ben, and Water Festival may appear both as cultural/lunar events and official holidays.
- The official holiday record is sourced yearly.
- A derived lunar/festival date is shown only when verified for that algorithm/year.
- The UI must show whether an item is official, derived, or personal.

## 8. Integration synchronization matrix

| Source                 | Trigger                                 | Cache/retention                              | Realtime?                              |
| ---------------------- | --------------------------------------- | -------------------------------------------- | -------------------------------------- |
| Gmail counts/list      | Active-session schedule, manual refresh | Minutes; purge sensitive cache on disconnect | No                                     |
| Gmail thread detail    | User opens thread                       | Short TTL; minimize body storage             | No                                     |
| YouTube search         | Debounced explicit search               | Minutes, quota-aware                         | No                                     |
| Local saved videos     | User mutation                           | Durable Supabase record                      | Yes, if multi-device benefit is needed |
| Search Console summary | Scheduled every 6–12 hours              | Days/months depending on finalized range     | No                                     |
| Search Console alerts  | After successful scheduled sync         | Notification record                          | Notification is realtime               |
| Khmer holidays         | Annual reviewed import                  | Permanent versioned reference                | No                                     |
| Lunar calculation      | Local pure calculation                  | Versioned computed result                    | No                                     |
| Personal events        | User mutation                           | Durable personal record                      | Yes                                    |

## 9. Provider error and retry policy

- Retry transient `429`/`5xx` responses with exponential backoff and jitter.
- Do not retry invalid grants, revoked tokens, permission failures, or validation errors automatically.
- Respect provider retry headers.
- Cap attempts and surface a sanitized failure through `sync_jobs` and Connected Services.
- Use a circuit-breaker cooldown per provider/account after repeated failures.
- Keep manual refresh from creating duplicate active jobs.

## 10. Features needing Google setup, approval, or consent

| Feature                                   | Google project/API   | User OAuth                                           | Likely review concern                                                                                     |
| ----------------------------------------- | -------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Google account identity                   | OAuth consent screen | Basic identity                                       | Standard consent configuration                                                                            |
| Gmail inbox/read/search/thread/attachment | Gmail API            | `gmail.readonly`                                     | Restricted-scope verification; security assessment may apply when server stores/transmits restricted data |
| Gmail archive/labels                      | Gmail API            | `gmail.modify`                                       | Restricted scope                                                                                          |
| Gmail drafts/replies                      | Gmail API            | `gmail.compose` and/or `gmail.send`                  | Restricted/sensitive scopes                                                                               |
| YouTube embed by URL                      | IFrame Player API    | No                                                   | Player terms and platform behavior                                                                        |
| YouTube public search                     | YouTube Data API     | API credential; OAuth not required for public search | Quota and API policy                                                                                      |
| YouTube account data                      | YouTube Data API     | YouTube read scope                                   | OAuth verification depending on publication/use                                                           |
| Search Console analytics                  | Search Console API   | `webmasters.readonly`                                | OAuth consent/verification requirements for requested user data                                           |

## Sources

- [Google OAuth 2.0 for web-server applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google OAuth security best practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices)
- [Gmail API scopes and classifications](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
- [YouTube Data API search](https://developers.google.com/youtube/v3/docs/search/list)
- [Search Console Search Analytics API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
- [Search Console usage limits](https://developers.google.com/webmaster-tools/limits)
- [Cambodia Ministry of Economy and Finance: 2026 public holiday calendar](https://mef.gov.kh/public-holiday-2026/)
