export interface RouteAccess {
  fullPath: string;
  guestOnly: boolean;
  path: string;
  requiresAuth: boolean;
  requiresProfile: boolean;
}

export interface AuthAccess {
  authenticated: boolean;
  profileComplete: boolean;
}

export function authRedirect(route: RouteAccess, auth: AuthAccess) {
  if (route.requiresAuth && !auth.authenticated)
    return { path: '/auth/login', query: { redirect: route.fullPath } };
  if (route.guestOnly && auth.authenticated)
    return { path: auth.profileComplete ? '/' : '/auth/profile-setup' };
  if (route.requiresProfile && auth.authenticated && !auth.profileComplete)
    return { path: '/auth/profile-setup' };
  if (route.path === '/auth/profile-setup' && auth.authenticated && auth.profileComplete)
    return { path: '/' };
  return null;
}

export function safeInternalRedirect(value: unknown) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : '/';
}
