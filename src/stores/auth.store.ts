import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { Session, User } from '@supabase/supabase-js';

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const loading = ref(false);
  const initialized = ref(false);

  return { currentUser, session, loading, initialized };
});
