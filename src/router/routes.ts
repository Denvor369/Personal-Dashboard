import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true, requiresProfile: true },
    children: [
      { path: '', component: () => import('@/pages/HomePage.vue'), meta: { title: 'Home' } },
      {
        path: 'tasks',
        component: () => import('@/pages/TasksPage.vue'),
        meta: { title: 'Tasks' },
      },
      {
        path: 'notes',
        component: () => import('@/pages/NotesPage.vue'),
        meta: { title: 'Notes' },
      },
      {
        path: 'learn',
        component: () => import('@/pages/LearnPage.vue'),
        meta: { title: 'Learn' },
      },
      {
        path: 'calendar',
        component: () => import('@/pages/CalendarPage.vue'),
        meta: { title: 'Calendar' },
      },
      {
        path: 'projects',
        component: () => import('@/pages/ProjectsPage.vue'),
        meta: { title: 'Projects' },
      },
      {
        path: 'bank',
        component: () => import('@/pages/BankPage.vue'),
        meta: { title: 'Bank' },
      },
      {
        path: 'career',
        component: () => import('@/pages/CareerPage.vue'),
        meta: { title: 'Career Hub' },
      },
      {
        path: 'goals',
        component: () => import('@/pages/GoalsPage.vue'),
        meta: { title: 'Goals & Roadmap' },
      },
      {
        path: 'websites',
        component: () => import('@/pages/WebsitesPage.vue'),
        meta: { title: 'Website Command Center' },
      },
      {
        path: 'connected-apps',
        component: () => import('@/pages/ConnectedAppsPage.vue'),
        meta: { title: 'Connected Apps' },
      },
      {
        path: 'timeline',
        component: () => import('@/pages/TimelinePage.vue'),
        meta: { title: 'Personal Timeline' },
      },
      {
        path: 'agency',
        component: () => import('@/pages/AgencyPage.vue'),
        meta: { title: 'Agency Hub' },
      },
      {
        path: 'settings',
        component: () => import('@/pages/SettingsPage.vue'),
        meta: { title: 'Settings' },
      },
    ],
  },
  {
    path: '/auth/login',
    alias: '/login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: { title: 'Sign in', guestOnly: true },
  },
  {
    path: '/auth/register',
    alias: '/register',
    component: () => import('@/pages/auth/RegisterPage.vue'),
    meta: { title: 'Create account', guestOnly: true },
  },
  {
    path: '/auth/forgot-password',
    component: () => import('@/pages/auth/ForgotPasswordPage.vue'),
    meta: { title: 'Forgot password', guestOnly: true },
  },
  {
    path: '/auth/reset-password',
    component: () => import('@/pages/auth/ResetPasswordPage.vue'),
    meta: { title: 'Reset password' },
  },
  {
    path: '/auth/verify',
    component: () => import('@/pages/auth/VerifyEmailPage.vue'),
    meta: { title: 'Verify email' },
  },
  {
    path: '/auth/profile-setup',
    component: () => import('@/pages/auth/ProfileSetupPage.vue'),
    meta: { title: 'Profile setup', requiresAuth: true },
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

// ponytail: dev-only design-system showcase. Remove this block (and
// DesignSystemPage.vue) before production. Inserted before the catch-all so it resolves.
if (import.meta.env.DEV) {
  routes.splice(routes.length - 1, 0, {
    path: '/design-system',
    component: () => import('@/pages/DesignSystemPage.vue'),
    meta: { requiresAuth: true, requiresProfile: true },
  });
}

export default routes;
