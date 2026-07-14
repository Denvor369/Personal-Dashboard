<template>
  <q-form class="profile-settings-form" @submit.prevent="save">
    <AuthMessage v-if="auth.error" tone="error">{{ auth.error }}</AuthMessage>
    <AvatarUploader />

    <div class="profile-settings-grid">
      <label class="workspace-field">
        <span class="workspace-field__label">Display name</span>
        <q-input
          v-model.trim="form.displayName"
          outlined
          autocomplete="name"
          maxlength="80"
          :rules="[(value) => Boolean(value) || 'Enter your display name']"
          lazy-rules
        />
      </label>
      <label class="workspace-field">
        <span class="workspace-field__label">Username</span>
        <q-input
          v-model.trim="form.username"
          outlined
          prefix="@"
          maxlength="30"
          :rules="[
            (value) => !value || /^[a-z0-9_]{3,30}$/.test(value) || 'Use 3–30 lowercase characters',
          ]"
          lazy-rules
        />
      </label>
    </div>

    <label class="workspace-field">
      <span class="workspace-field__label">Bio</span>
      <q-input v-model="form.bio" outlined type="textarea" maxlength="280" counter autogrow />
    </label>

    <div class="profile-settings-grid">
      <label class="workspace-field">
        <span class="workspace-field__label">Timezone</span>
        <q-select
          v-model="form.timezone"
          outlined
          use-input
          input-debounce="0"
          :options="filteredTimezones"
          @filter="filterTimezones"
        />
      </label>
      <label class="workspace-field">
        <span class="workspace-field__label">Theme</span>
        <q-select v-model="form.theme" outlined emit-value map-options :options="profileThemes" />
      </label>
    </div>

    <div class="account-email">
      <q-icon name="alternate_email" />
      <div>
        <strong>Account email</strong><span>{{ auth.user?.email }}</span>
      </div>
      <small>Used for sign-in and account recovery</small>
    </div>

    <footer class="profile-settings-actions">
      <AppButton variant="ghost" :disabled="auth.loading" @click="signOut">Sign out</AppButton>
      <AppButton type="submit" :loading="auth.loading" :disabled="!dirty">Save profile</AppButton>
    </footer>
  </q-form>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppButton from '@/components/ui/AppButton.vue';
import AuthMessage from '@/components/auth/AuthMessage.vue';
import AvatarUploader from '@/components/auth/AvatarUploader.vue';
import { profileThemes, timezones } from '@/data/profile-options';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import type { ProfileDraft } from '@/types/profile';

const emit = defineEmits<{ dirtyChange: [dirty: boolean] }>();
const auth = useAuthStore();
const ui = useUiStore();
const $q = useQuasar();
const filteredTimezones = ref(timezones);
const saved = ref('');
const form = reactive<ProfileDraft>({
  displayName: '',
  username: '',
  bio: '',
  timezone: 'Asia/Phnom_Penh',
  theme: 'system',
});
const serialized = computed(() => JSON.stringify(form));
const dirty = computed(() => Boolean(saved.value) && serialized.value !== saved.value);

watch(
  () => auth.profile,
  (profile) => {
    if (!profile) return;
    Object.assign(form, {
      displayName: profile.display_name,
      username: profile.username ?? '',
      bio: profile.bio ?? '',
      timezone: profile.timezone,
      theme: profile.theme,
    });
    saved.value = JSON.stringify(form);
  },
  { immediate: true },
);
watch(dirty, (value) => emit('dirtyChange', value), { immediate: true });

function filterTimezones(value: string, update: (callback: () => void) => void) {
  update(() => {
    const query = value.trim().toLocaleLowerCase();
    filteredTimezones.value = query
      ? timezones.filter((timezone) => timezone.toLocaleLowerCase().includes(query))
      : timezones;
  });
}

async function save() {
  try {
    await auth.updateProfile({
      ...form,
      profileCompleted: auth.profile?.profile_completed ?? true,
    });
    ui.setTheme(form.theme);
    saved.value = JSON.stringify(form);
    $q.notify({ type: 'positive', message: 'Profile updated' });
  } catch {
    // Store exposes the safe, user-facing error.
  }
}

async function signOut() {
  if (dirty.value && !window.confirm('Discard unsaved profile changes and sign out?')) return;
  try {
    await auth.logout();
    saved.value = serialized.value;
    window.location.assign(`${window.location.origin}/#/auth/login`);
  } catch {
    $q.notify({ type: 'negative', message: auth.error });
  }
}

function confirmUnload(event: BeforeUnloadEvent) {
  if (!dirty.value) return;
  event.preventDefault();
}

onMounted(() => window.addEventListener('beforeunload', confirmUnload));
onBeforeUnmount(() => window.removeEventListener('beforeunload', confirmUnload));
</script>

<style scoped lang="scss">
.profile-settings-form {
  display: grid;
  gap: var(--space-4);
}
.profile-settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}
.account-email {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: var(--border-thin);
  border-radius: var(--radius-md);
  background: var(--color-surface-raised);
}
.account-email > .q-icon {
  color: var(--color-primary);
  font-size: 1.5rem;
}
.account-email div {
  display: flex;
  flex-direction: column;
}
.account-email span,
.account-email small {
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.72rem;
}
.profile-settings-actions {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}
@media (max-width: 600px) {
  .profile-settings-grid {
    grid-template-columns: 1fr;
  }
  .account-email {
    grid-template-columns: auto 1fr;
  }
  .account-email small {
    grid-column: 2;
  }
}
</style>
