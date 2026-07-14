# Personal Operating System — Product Blueprint

Status: planning baseline  
Last reviewed: 2026-07-13

## 1. Product definition

### Purpose

Personal Dashboard is a private Personal Operating System: one calm place to decide what matters, do focused work, retrieve personal knowledge, and review signals from connected services.

It is not intended to replace every source application. It should summarize, connect, and launch the right context while keeping authoritative data in the correct system.

### Main experience

1. Open Home and understand the day in under 30 seconds.
2. See priorities, schedule, focus state, and relevant alerts without opening several apps.
3. Continue into a full module when a widget is not enough.
4. Capture tasks, notes, events, and reminders quickly from desktop or mobile.
5. Customize Home without losing a stable default layout.
6. Connect external services only when their value justifies their permissions.

### Difference from a normal dashboard

A normal dashboard mostly displays metrics. This system also supports action, memory, planning, and continuity:

- Widgets are entry points into working modules, not decorative charts.
- Personal records and external-service summaries share a consistent navigation model.
- Desktop and mobile layouts are intentionally different views of the same data.
- The system can grow module by module without making every module depend on every other one.
- Privacy, permission visibility, synchronization health, and disconnect controls are first-class product features.

### Core principles

1. **Calm by default:** show only information that changes a decision.
2. **Local-first interaction, cloud-backed records:** optimistic UI where safe, Supabase as the source of truth for synced personal data.
3. **Module independence:** a module owns its pages, data access, and domain types.
4. **Progressive permissions:** connect services and request scopes only when a related feature is enabled.
5. **Server-mediated integrations:** OAuth secrets, refresh tokens, provider calls, and rate limits stay behind a secure server layer.
6. **Mobile is prioritized, not compressed:** mobile has its own layout order and fewer visible widgets.
7. **Failure isolation:** one broken widget or integration must not block Home.
8. **Verified cultural data:** Khmer lunar calculations and official holidays must show source and verification status.
9. **Accessible and installable:** keyboard access, reduced motion, readable contrast, PWA behavior, and Capacitor-safe interactions are part of done.
10. **No speculative platform:** add shared abstractions only after two real modules need them.

### Design continuity

The Personal OS should extend the existing visual language rather than introduce a new theme:

| Role                                                | Token                |
| --------------------------------------------------- | -------------------- |
| Main background and light surfaces                  | Cream `#FFF4E1`      |
| Highlights, progress and active secondary states    | Mint `#89D7B7`       |
| Actions, charts and medium emphasis                 | Teal `#428475`       |
| Primary text, navigation and dark contrast surfaces | Deep green `#1A312C` |

- Micuale remains the heading, page-title, statistic, and large-number face.
- Charsey remains the paragraph and long-form reading face.
- Altere remains the face for buttons, navigation, tabs, links, and controls.
- New modules reuse the rounded shell, large cards, thin deep-green borders, small connected-card gaps, minimal shadows, and visible keyboard focus.
- Integration branding may appear only where provider identification or policy requires it; it must not replace the application palette.

## 2. Recommended first version

The first usable release should be valuable without Google integrations.

### Include

- Existing visual design system and responsive application shell
- Stable desktop and mobile navigation
- Customizable Home with a small widget registry
- Separate desktop and mobile widget layouts
- Widget show/hide, reorder, resize, refresh, and reset-to-default
- Widget loading, error, empty, and stale states
- Tasks with status, due date, priority, and project association
- Notes with basic organization and search
- Projects with status, dates, and linked tasks/notes
- Standard personal calendar events and reminders
- In-app notifications
- Settings for theme, locale, time zone, dashboard layout, and privacy
- PWA installation and reliable mobile web behavior

### Delay

- Gmail compose/reply/archive and attachment workflows
- Multiple Google accounts
- Unified cross-module search
- Search Console alerts and complex comparisons
- YouTube account playlist mutation
- Offline conflict resolution across multiple devices
- AI summaries, recommendations, or automation
- Public widget marketplace or third-party plugin SDK
- Full native Android/iOS specialization and device plugins
- Khmer lunar output presented as authoritative before trusted validation

## 3. Navigation structure

### Desktop

Use a persistent primary navigation area with a compact Apps launcher. Keep the most frequently acted-on modules direct.

| Placement | Items                                          | Reason                                                            |
| --------- | ---------------------------------------------- | ----------------------------------------------------------------- |
| Primary   | Home, Tasks, Calendar, Notes, Projects         | Daily planning and capture require one-click access.              |
| Apps      | Gmail, YouTube, Search Console, Khmer Calendar | Valuable but used less consistently or dependent on integrations. |
| Utility   | Notifications, Search, Settings, Profile       | Global actions, not domain destinations.                          |

Recommendations:

- Keep Home first and visually active.
- Notifications should open a panel; a full page is optional later.
- Apps opens a labeled popover or page, not an icon-only mystery menu.
- Allow pinning at most two Apps items into primary navigation later.
- Hide integration modules that are disabled, but keep them discoverable in Apps and Settings.

### Mobile

Use a fixed five-item bottom navigation:

1. Home
2. Tasks
3. Add
4. Calendar
5. More

The central Add action opens a small capture sheet for a task, note, or event. More contains:

- Notes
- Projects
- Gmail
- YouTube
- Search Console
- Khmer Calendar
- Notifications
- Settings

Rules:

- Do not put ten destinations in a horizontally scrolling bottom bar.
- Preserve the last selected More destination during a session.
- Show connection state beside integration modules when action is required.
- Keep search available from the compact header; unified search is a later feature.

## 4. Home product model

Home is a customizable view, not a second implementation of every module.

### Default desktop widgets

- Welcome and daily overview
- Current focus
- Today’s tasks
- Focus timer
- Weekly progress
- Weekly calendar
- Quick access
- Notification summary

### Default mobile widgets

- Daily overview
- Current focus
- Today’s tasks
- Focus timer
- Upcoming schedule
- Important notifications

Integration widgets should be opt-in:

- Gmail inbox summary
- Search Console performance
- YouTube now playing/saved item
- Khmer date and upcoming holiday

### Customization rules

- A user can show, hide, reorder, and resize supported widgets.
- Every widget has a sensible default size and settings.
- A hidden widget retains settings but does not fetch data.
- Mobile and desktop layouts are edited independently.
- Reset restores a versioned product default without deleting widget settings.
- Unsupported sizes cannot be selected.
- A failed widget remains movable and removable.

## 5. Module product boundaries

| Module         | Owns                                              | Does not own                         |
| -------------- | ------------------------------------------------- | ------------------------------------ |
| Dashboard      | Widget composition and layout                     | Module business records              |
| Tasks          | Task lifecycle and task views                     | Project lifecycle                    |
| Notes          | Notes, tags, note search                          | Global search orchestration          |
| Projects       | Project lifecycle and associations                | Task rendering internals             |
| Calendar       | Personal events and reminders                     | Khmer lunar calculation              |
| Gmail          | Cached Gmail views and actions                    | OAuth token storage implementation   |
| YouTube        | Player state and saved local references           | YouTube account data without consent |
| Search Console | Cached performance views and alerts               | Live per-render provider queries     |
| Khmer Calendar | Verified lunar presentation and official holidays | Personal event ownership             |
| Notifications  | Notification inbox and preferences                | Domain-specific business rules       |
| Settings       | Preferences and connection management             | Provider API execution               |

## 6. Success measures

Track product usefulness before adding more integrations:

- Home becomes actionable within two seconds on a normal mobile connection.
- A task, note, or event can be captured in three interactions or fewer from mobile.
- The default dashboard works before customization.
- A widget failure never causes a page-level failure.
- External API calls per active user remain within defined sync budgets.
- Every connected service clearly shows scopes, last sync, error state, and disconnect.
- A new independent module can be lazy-loaded without editing existing module internals.

## 7. MVP summary

The recommended MVP is Home customization plus Tasks, Notes, Projects, standard Calendar, Notifications, and Settings. It intentionally excludes Google integrations and authoritative Khmer lunar output until secure OAuth infrastructure and trusted validation datasets exist.
