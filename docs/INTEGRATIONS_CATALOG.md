# Integrations Catalog

Source of truth for Connected Apps. The typed registry lives in
`src/data/integrations.mock.ts`; the page renders it via
`src/components/integrations/IntegrationCard.vue`.

**Only GitHub is real today** (fine-grained PAT validated against the GitHub API,
stored in `connected_accounts` with owner-only RLS — see
`supabase/migrations/202607130004_connected_accounts.sql` and
`src/services/supabase/integrations.service.ts`). Everything else is catalog-only:
status "Coming soon", Connect disabled, nothing requested or stored.

| Integration           | Category             | Status          | Auth needed                | Server-side tokens               | Dashboard data planned                            |
| --------------------- | -------------------- | --------------- | -------------------------- | -------------------------------- | ------------------------------------------------- |
| Gmail                 | Google               | Coming soon     | Google OAuth               | Yes (refresh token)              | Job-related email, follow-ups                     |
| YouTube               | Google               | Coming soon     | Google OAuth               | Yes                              | Learning playlists, channel stats                 |
| Google Search Console | Google               | Coming soon     | Google OAuth               | Yes                              | Clicks/impressions, top queries, indexing         |
| Google Calendar       | Google               | Coming soon     | Google OAuth               | Yes                              | Events in Khmer calendar, reminders               |
| Google Drive          | Google               | Coming soon     | Google OAuth               | Yes                              | CV versions, document links                       |
| Google Analytics 4    | Analytics            | Coming soon     | Google OAuth               | Yes                              | Visitors, sessions, sources, pages, devices       |
| PageSpeed Insights    | Analytics            | Coming soon     | API key only (public API)  | No (key can be restricted)       | Performance/a11y/SEO/best-practice scores, issues |
| GitHub                | Development          | **Implemented** | Fine-grained PAT           | RLS row (user-owned)             | Repo status, issues, deploys                      |
| Supabase              | Development          | Coming soon     | Management API token       | Yes                              | Project status, DB/auth/storage usage, logs       |
| Sentry                | Development          | Coming soon     | Auth token                 | Yes                              | Errors, affected users, unresolved issues         |
| Figma                 | Design               | Coming soon     | PAT or OAuth               | Yes                              | Recent files, projects, prototype links           |
| Cloudflare            | Hosting & Monitoring | Coming soon     | API token                  | Yes + CORS proxy (edge function) | DNS, domain expiry, Pages deploys                 |
| Vercel                | Hosting & Monitoring | Coming soon     | API token                  | Yes                              | Deploy status, build history                      |
| Hostinger             | Hosting & Monitoring | Coming soon     | API token (limited API)    | Yes                              | Hosting status, domain renewals                   |
| Better Stack          | Hosting & Monitoring | Coming soon     | API token                  | Yes                              | Uptime, response time, incidents, status page     |
| Notion                | Productivity         | Coming soon     | Internal integration token | Yes                              | Recent pages, databases, notes                    |

## Recommended implementation order

1. **Google Analytics 4** — highest daily value; one Google OAuth setup unlocks 2–6.
2. **PageSpeed Insights** — easiest real win (public API, no account data).
3. **Supabase** — this app already runs on it; management token is simple.
4. **Figma** — PAT-based like GitHub; reuse the same connect dialog pattern.
5. **Sentry** — token-based; needs a project emitting events first.
6. **Better Stack** — token-based; needs monitors configured first.
7. **Notion** — internal integration token; scope carefully.

## Architecture notes

- **Google family**: one OAuth consent screen + client in Google Cloud Console
  covers Gmail/YouTube/GSC/Calendar/Drive/GA4. Token exchange and refresh must
  happen server-side (Supabase Edge Function) — never in the SPA.
- **Token-based providers** (GitHub ✅, Figma, Sentry, Vercel, Better Stack,
  Notion, Supabase): reuse the GitHub pattern — validate against the provider,
  upsert into `connected_accounts` (`provider` is the unique key per user).
- **Cloudflare** blocks browser CORS: calls must proxy through an edge function
  even with a stored token.
- Adding a service to the UI = one entry in `integrations.mock.ts`. Flip
  `connectEnabled: true` only when its real connect flow ships.
