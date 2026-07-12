import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
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
        path: 'calendar',
        component: () => import('@/pages/CalendarPage.vue'),
        meta: { title: 'Calendar' },
      },
      {
        path: 'settings',
        component: () => import('@/pages/SettingsPage.vue'),
        meta: { title: 'Settings' },
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
