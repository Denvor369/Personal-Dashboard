# Personal Dashboard

A clean application foundation built with Quasar, Vue 3, TypeScript, Vite, Pinia, Vue Router, Supabase, TanStack Query, PWA support, and Capacitor.

The application includes a responsive personal dashboard, Supabase email/password authentication,
private profiles, and user-scoped knowledge data foundations.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set the Supabase project values in `.env`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The application reports a clear startup error until both values are set. Never put a Supabase service-role key in client environment variables.

Apply the Supabase migrations and configure email verification before testing accounts. See
[docs/AUTH_SETUP.md](docs/AUTH_SETUP.md).

## Commands

```bash
npm run dev             # Web development
npm run build           # Production web build
npm run typecheck       # TypeScript validation
npm run lint            # ESLint
npm run format          # Prettier
npm run dev:pwa         # PWA development
npm run build:pwa       # Production PWA build
npm run dev:android     # Capacitor Android development
npm run dev:ios         # Capacitor iOS development (macOS/Xcode required)
npm run build:android   # Capacitor Android build
npm run build:ios       # Capacitor iOS build (macOS/Xcode required)
```

The first Capacitor command for a target creates its native platform folder. Android Studio is required for Android; Xcode and CocoaPods are required for iOS.

## Structure

```text
src/
├── boot/                 # Supabase and Vue Query initialization
├── components/layout/    # Shared responsive navigation shell
├── css/                  # Global and Quasar theme styles
├── layouts/              # Main application layout
├── pages/                # Route placeholders
├── router/               # Routes and shared navigation metadata
└── stores/               # UI and authentication state
src-capacitor/            # Capacitor configuration (no platforms yet)
src-pwa/                  # Manifest and service worker setup
```
