<template>
  <AuthShell>
    <header class="auth-card__heading">
      <p class="dashboard-eyebrow">Profile setup</p>
      <h2>Make it yours</h2>
      <p>Two short steps, then you’re in.</p>
    </header>
    <div class="profile-steps" aria-label="Profile setup progress">
      <span :data-active="step >= 1" /><span :data-active="step >= 2" />
    </div>

    <q-form class="auth-form" @submit.prevent="next">
      <AuthMessage v-if="auth.error" tone="error">{{ auth.error }}</AuthMessage>
      <template v-if="step === 1">
        <AvatarUploader />
        <q-input
          v-model.trim="form.displayName"
          outlined
          label="Display name"
          autocomplete="name"
          maxlength="80"
          :rules="[(value) => Boolean(value) || 'Enter your display name']"
          lazy-rules
        />
        <q-input
          v-model.trim="form.username"
          outlined
          label="Username (optional)"
          prefix="@"
          maxlength="30"
          hint="Lowercase letters, numbers and underscores"
          :rules="[
            (value) => !value || /^[a-z0-9_]{3,30}$/.test(value) || 'Use 3–30 lowercase characters',
          ]"
          lazy-rules
        />
      </template>

      <template v-else>
        <q-input
          v-model="form.bio"
          outlined
          type="textarea"
          label="Short bio (optional)"
          maxlength="280"
          counter
          autogrow
        />
        <q-select
          v-model="form.timezone"
          outlined
          use-input
          input-debounce="0"
          label="Timezone"
          :options="filteredTimezones"
          @filter="filterTimezones"
        />
        <q-select
          v-model="form.theme"
          outlined
          emit-value
          map-options
          label="Preferred theme"
          :options="profileThemes"
        />
      </template>

      <div class="auth-form__row">
        <AppButton v-if="step === 2" variant="ghost" @click="step = 1">Back</AppButton>
        <AppButton type="submit" :loading="auth.loading">
          {{ step === 1 ? 'Continue' : 'Finish setup' }}
        </AppButton>
      </div>
    </q-form>
  </AuthShell>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';
import AuthMessage from '@/components/auth/AuthMessage.vue';
import AuthShell from '@/components/auth/AuthShell.vue';
import AvatarUploader from '@/components/auth/AvatarUploader.vue';
import { profileThemes, timezones } from '@/data/profile-options';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import type { ProfileDraft } from '@/types/profile';

const auth = useAuthStore();
const ui = useUiStore();
const router = useRouter();
const $q = useQuasar();
const step = ref(1);
const filteredTimezones = ref(timezones);
const form = reactive<ProfileDraft>({
  displayName: '',
  username: '',
  bio: '',
  timezone: 'Asia/Phnom_Penh',
  theme: 'system',
});

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
  },
  { immediate: true },
);

function filterTimezones(value: string, update: (callback: () => void) => void) {
  update(() => {
    const query = value.trim().toLocaleLowerCase();
    filteredTimezones.value = query
      ? timezones.filter((timezone) => timezone.toLocaleLowerCase().includes(query))
      : timezones;
  });
}

async function next() {
  if (step.value === 1) {
    step.value = 2;
    return;
  }
  try {
    await auth.updateProfile({ ...form, profileCompleted: true });
    ui.setTheme(form.theme);
    $q.notify({ type: 'positive', message: 'Profile setup complete' });
    await router.replace('/');
  } catch {
    // Store exposes the safe, user-facing error.
  }
}
</script>
