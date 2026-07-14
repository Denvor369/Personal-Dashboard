import { defineRouter } from '#q-app';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import routes from './routes';
import { useAuthStore } from '@/stores/auth.store';
import { authRedirect } from './auth-guard';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(({ store }) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
  });

  const auth = useAuthStore(store);
  Router.beforeEach(async (to) => {
    await auth.initializeAuth();
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
    const requiresProfile = to.matched.some((record) => record.meta.requiresProfile);
    const guestOnly = to.matched.some((record) => record.meta.guestOnly);

    const redirect = authRedirect(
      { fullPath: to.fullPath, guestOnly, path: to.path, requiresAuth, requiresProfile },
      {
        authenticated: Boolean(auth.session),
        profileComplete: Boolean(auth.profile?.profile_completed),
      },
    );
    if (redirect) return redirect;

    document.title = `${String(to.meta.title ?? 'Dashboard')} · Personal Dashboard`;
    return true;
  });

  return Router;
});
