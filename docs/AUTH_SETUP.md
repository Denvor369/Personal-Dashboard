# Authentication and profile setup

The dashboard uses Supabase email/password authentication with PKCE, persistent Supabase-managed sessions, a private `profiles` table, and a private `avatars` Storage bucket.

## 1. Required environment variables

Copy `.env.example` to `.env` and set the public project values:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
```

Never add `SUPABASE_SERVICE_ROLE_KEY` to a client environment variable or commit it to the repository.

## 2. Apply the database migration

Apply migrations in filename order with your normal Supabase deployment workflow. The authentication migration is:

```text
supabase/migrations/202607130002_auth_profiles.sql
```

It creates and backfills `public.profiles`, installs the `auth.users` profile trigger, enables profile RLS, creates the private `avatars` bucket with a 2 MB limit, and adds user-folder Storage policies.

If this repository is not linked to the Supabase CLI, paste the migration into the Supabase SQL Editor once. Do not run only part of the migration.

## 3. Configure Supabase Auth

In **Authentication → Providers → Email**:

- Enable Email provider.
- Enable email confirmations.
- Keep secure password requirements enabled; the client also requires at least eight characters.

In **Authentication → URL Configuration**:

- Set the Site URL to the production application origin.
- Add `http://localhost:9000/**` for local Quasar development.
- Add the production application origin with `/**` to Redirect URLs.
- Add preview/staging origins individually; do not use an unrestricted external redirect.

The application sends email verification to `/#/auth/verify` and password recovery to `/#/auth/reset-password`. Supabase returns the PKCE authorization code to the same browser, and the Supabase client exchanges it automatically.

Update the **Confirm signup** and **Reset password** email templates with the product name and keep the supplied confirmation URL token intact.

## 4. How route protection works

- Dashboard routes inherit `requiresAuth` and `requiresProfile` metadata.
- Guests are redirected to `/auth/login` with their internal intended destination.
- Login/register pages use `guestOnly` and redirect authenticated users away.
- Verified users whose profile is incomplete are sent to `/auth/profile-setup`.
- Only internal paths beginning with one `/` are accepted as post-login redirects.
- The Pinia auth store creates one `onAuthStateChange` subscription and restores the Supabase session on startup.

## 5. Avatar security

The `avatars` bucket is private. Objects are written as:

```text
avatars/{authenticated_user_id}/{random_filename}
```

The UI never accepts a user ID from a form. It derives the owner from `supabase.auth.getUser()`, accepts JPEG/PNG/WebP up to 2 MB, downsizes images with browser canvas APIs when useful, uses random filenames, and serves previews through short-lived signed URLs.

## 6. Multi-user data rule

Every future user-owned table—tasks, projects, calendar events, dashboard widgets/layouts, and connected accounts—must include:

```sql
user_id uuid not null references auth.users(id) on delete cascade
```

Enable RLS in the same migration and scope both `using` and `with check` to `(select auth.uid()) = user_id`. Never trust a client-supplied owner without that database policy. Existing knowledge-system tables already follow this pattern.

## 7. Manual verification checklist

Use two separate private-browser profiles:

1. Register User A, open the confirmation email on the same browser, and complete profile setup.
2. Confirm `public.profiles.id` matches User A’s `auth.users.id`.
3. Refresh and confirm the session returns without another login.
4. Upload, replace, and remove an avatar; confirm the object path begins with User A’s UUID.
5. Edit the profile and verify the account email remains read-only.
6. Sign out and confirm private routes redirect to Login.
7. Request password recovery and confirm the UI gives the same generic response for any email.
8. Register User B in another browser profile.
9. As User B, direct-select or update User A’s profile UUID and confirm zero rows are returned/changed.
10. Attempt to read or delete User A’s avatar path and confirm Storage denies access.

Registration emails, real password-reset delivery, and two-user RLS checks require the migration and Auth URL settings to be active in the target Supabase project.
