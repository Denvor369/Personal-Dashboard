# New Modules Overview

Six feature modules added to the Personal Dashboard, tailored to a website
developer / job seeker / student / future agency owner. **All modules use typed
mock data and are NOT persistent yet** — edits live in local component state and
reset on reload. The data models are shaped for Supabase later.

## Pages

| Module | Route | Purpose |
|--------|-------|---------|
| Career Hub | `/career` | Manage job applications, interviews, CV/document versions, skill gaps, and a career roadmap. |
| Goals & Roadmap | `/goals` | Long-term goals across career, education, finance, projects, business, personal — with milestones. |
| Website Command Center | `/websites` | Track websites, domains, deployments, repositories, hosting, SSL, and maintenance. |
| Connected Apps | `/connected-apps` | Central place for current/future integrations. No real OAuth — "Not connected" / "Coming soon" states only. |
| Personal Timeline | `/timeline` | Private record of achievements, milestones, projects, learning, and memories over time. |
| Agency Hub | `/agency` | Early workspace foundation for a web + social agency: clients, services, projects, deliverables. |

Every page uses the shared `MainLayout` (authenticated + route-protected),
`DashboardPageHeader`, existing design tokens/themes/fonts, and the shared
`App*` UI components. Each has: eyebrow, title, description, main action,
overview stats, tabbed/filtered content, loading skeletons, empty state, and a
detail panel (side drawer on desktop, bottom sheet on mobile).

## Current mock-data status

Typed mock files (no persistence):

- `src/data/career.mock.ts`
- `src/data/goals.mock.ts`
- `src/data/websites.mock.ts`
- `src/data/integrations.mock.ts`
- `src/data/timeline.mock.ts`
- `src/data/agency.mock.ts`

Types are co-located in each mock file. Loading states are simulated via
`src/composables/useMockLoad.ts`. Creating an item shows a clear
"(mock — not saved yet)" toast.

> **Architecture note:** pages live in `src/pages/` and data in `src/data/`,
> matching the existing app convention rather than the suggested `src/modules/`
> tree. Per-module stores/services/composables were intentionally **not** created
> (YAGNI) — editing uses local component state until Supabase is wired. Add
> feature stores when real persistence lands.

## Navigation structure

Desktop primary bar stays compact:

`Dashboard · Tasks · Calendar · Projects · More ▾`

**More** menu (desktop) and mobile **More** sheet contain:
Notes, Learn, Career, Goals, Websites, Bank, Timeline, Connected Apps, Agency,
Settings (mobile also lists Projects).

Mobile bottom bar unchanged: `Home · Tasks · Add · Calendar · More`.
Active route styling is preserved; the More trigger reflects `aria-current`
when a More route is active. Command palette (⌘/Ctrl+K) registers navigation +
creation commands for all new modules.

## Planned future Supabase tables

Every table must include `user_id uuid not null references auth.users(id)` and
enable **Row Level Security** (owner-only policies). Migrations are NOT created
in this task — this is the recommended shape only.

- `career_applications`, `career_interviews`, `career_documents`
- `goals`, `goal_milestones`
- `websites`, `website_issues`
- `connected_accounts`
- `timeline_entries`
- `agency_clients`, `agency_services`, `agency_projects`, `agency_deliverables`

## Future integration requirements

Connected Apps is UI-only. Before any real connection:

- OAuth must run **server-side** with secure, server-stored tokens (never in the client).
- Request the minimum scopes shown per service.
- Support disconnect / revoke.
- No Google/GitHub/Cloudflare/Vercel/Hostinger APIs are called yet.

## Recommended persistence order

1. Career
2. Goals
3. Websites
4. Timeline
5. Agency
6. Connected Apps — only once a secure OAuth + token architecture exists.
