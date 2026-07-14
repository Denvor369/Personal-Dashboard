import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { Session, Subscription, User } from '@supabase/supabase-js';
import {
  authErrorMessage,
  changePassword,
  getAuthSession,
  loginAccount,
  logoutAccount,
  registerAccount,
  sendPasswordReset,
  subscribeToAuth,
} from '@/services/supabase/auth.service';
import {
  avatarSignedUrl,
  getProfile,
  profileErrorMessage,
  removeProfileAvatar,
  saveProfile,
  uploadProfileAvatar,
} from '@/services/supabase/profile.service';
import type { LoginCredentials, RegistrationCredentials } from '@/types/auth';
import type { Profile, ProfileDraft } from '@/types/profile';

let authSubscription: Subscription | undefined;
let initializePromise: Promise<void> | undefined;

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const profile = ref<Profile | null>(null);
  const avatarUrl = ref<string | null>(null);
  const loading = ref(false);
  const initialized = ref(false);
  const error = ref('');
  const recoveryMode = ref(false);
  const uploadProgress = ref(0);
  const currentUser = computed(() => user.value);

  function setSession(nextSession: Session | null) {
    session.value = nextSession;
    user.value = nextSession?.user ?? null;
    if (!nextSession) {
      profile.value = null;
      avatarUrl.value = null;
      recoveryMode.value = false;
    }
  }

  async function fetchProfile() {
    if (!user.value) return null;
    try {
      const nextProfile = await getProfile();
      profile.value = nextProfile;
      avatarUrl.value = await avatarSignedUrl(nextProfile?.avatar_url ?? null);
      return nextProfile;
    } catch (caught) {
      error.value = profileErrorMessage(caught);
      return null;
    }
  }

  function initializeAuth() {
    if (initializePromise) return initializePromise;
    initializePromise = (async () => {
      if (!authSubscription) {
        authSubscription = subscribeToAuth((event, nextSession) => {
          setSession(nextSession);
          recoveryMode.value = event === 'PASSWORD_RECOVERY';
          if (nextSession?.user)
            window.setTimeout(() => {
              void fetchProfile();
            });
        });
      }
      try {
        const restored = await getAuthSession();
        setSession(restored);
        if (restored?.user) await fetchProfile();
      } catch (caught) {
        error.value = authErrorMessage(caught);
      } finally {
        initialized.value = true;
      }
    })();
    return initializePromise;
  }

  async function run<T>(action: () => Promise<T>, message: (caught: unknown) => string) {
    loading.value = true;
    error.value = '';
    try {
      return await action();
    } catch (caught) {
      error.value = message(caught);
      throw caught;
    } finally {
      loading.value = false;
    }
  }

  async function register(credentials: RegistrationCredentials) {
    return run(() => registerAccount(credentials), authErrorMessage);
  }

  async function login(credentials: LoginCredentials) {
    const data = await run(() => loginAccount(credentials), authErrorMessage);
    setSession(data.session);
    await fetchProfile();
    return data;
  }

  async function logout() {
    await run(logoutAccount, authErrorMessage);
    setSession(null);
  }

  async function requestPasswordReset(email: string) {
    return run(() => sendPasswordReset(email), authErrorMessage);
  }

  async function updatePassword(password: string) {
    await run(() => changePassword(password), authErrorMessage);
    recoveryMode.value = false;
  }

  async function updateProfile(draft: ProfileDraft) {
    const saved = await run(() => saveProfile(draft), profileErrorMessage);
    profile.value = saved;
    return saved;
  }

  async function uploadAvatar(file: File) {
    uploadProgress.value = 0;
    try {
      const path = await uploadProfileAvatar(
        file,
        profile.value?.avatar_url ?? null,
        (value) => (uploadProgress.value = value),
      );
      if (profile.value) profile.value = { ...profile.value, avatar_url: path };
      avatarUrl.value = await avatarSignedUrl(path);
    } catch (caught) {
      error.value = profileErrorMessage(caught);
      throw caught;
    } finally {
      window.setTimeout(() => (uploadProgress.value = 0), 500);
    }
  }

  async function removeAvatar() {
    const path = profile.value?.avatar_url ?? null;
    try {
      await removeProfileAvatar(path);
      if (profile.value) profile.value = { ...profile.value, avatar_url: null };
      avatarUrl.value = null;
    } catch (caught) {
      error.value = profileErrorMessage(caught);
      throw caught;
    }
  }

  function clearError() {
    error.value = '';
  }

  return {
    user,
    currentUser,
    session,
    profile,
    avatarUrl,
    loading,
    initialized,
    error,
    recoveryMode,
    uploadProgress,
    initializeAuth,
    register,
    login,
    logout,
    requestPasswordReset,
    updatePassword,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    clearError,
  };
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    authSubscription?.unsubscribe();
    authSubscription = undefined;
    initializePromise = undefined;
  });
}
