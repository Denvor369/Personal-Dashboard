<template>
  <AuthShell>
    <header class="auth-card__heading">
      <p class="dashboard-eyebrow">Secure account</p>
      <h2>Choose a new password</h2>
      <p>Use a password you do not reuse elsewhere.</p>
    </header>

    <q-form v-if="auth.session" class="auth-form" @submit.prevent="submit">
      <AuthMessage v-if="auth.error" tone="error">{{ auth.error }}</AuthMessage>
      <q-input
        v-model="password"
        outlined
        :type="showPassword ? 'text' : 'password'"
        label="New password"
        autocomplete="new-password"
        :rules="[(value) => value.length >= 8 || 'Use at least 8 characters']"
        lazy-rules
      >
        <template #append>
          <q-btn
            flat
            round
            dense
            :icon="showPassword ? 'visibility_off' : 'visibility'"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          />
        </template>
      </q-input>
      <PasswordStrength :password="password" />
      <q-input
        v-model="confirmPassword"
        outlined
        type="password"
        label="Confirm new password"
        autocomplete="new-password"
        :rules="[(value) => value === password || 'Passwords do not match']"
        lazy-rules
      />
      <div class="auth-form__actions">
        <AppButton type="submit" size="large" :loading="auth.loading">Update password</AppButton>
      </div>
    </q-form>
    <div v-else class="auth-form">
      <AuthMessage tone="error">This reset link is invalid or has expired.</AuthMessage>
      <RouterLink class="auth-link" to="/auth/forgot-password">Request another link</RouterLink>
    </div>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';
import AuthMessage from '@/components/auth/AuthMessage.vue';
import AuthShell from '@/components/auth/AuthShell.vue';
import PasswordStrength from '@/components/auth/PasswordStrength.vue';
import { useAuthStore } from '@/stores/auth.store';

const auth = useAuthStore();
const router = useRouter();
const $q = useQuasar();
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);

async function submit() {
  if (password.value !== confirmPassword.value) return;
  try {
    await auth.updatePassword(password.value);
    $q.notify({ type: 'positive', message: 'Password updated' });
    await router.replace(auth.profile?.profile_completed ? '/' : '/auth/profile-setup');
  } catch {
    // Store exposes the safe, user-facing error.
  }
}
</script>
