import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { defineBoot } from '#q-app';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default defineBoot(({ app }) => {
  app.use(VueQueryPlugin, {
    queryClient,
    enableDevtoolsV6Plugin: import.meta.env.DEV,
  });
});
