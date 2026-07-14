<template>
  <AuthShell>
    <header class="auth-card__heading">
      <p class="dashboard-eyebrow">Welcome back</p>
      <h2>Sign in</h2>
      <p>Continue to your private dashboard.</p>
    </header>

    <q-form class="auth-form" @submit.prevent="submit">
      <AuthMessage v-if="auth.error" tone="error">{{ auth.error }}</AuthMessage>
      <q-input
        v-model.trim="email"
        outlined
        type="email"
        label="Email"
        autocomplete="email"
        inputmode="email"
        :rules="[(value) => Boolean(value) || 'Enter your email address']"
        lazy-rules
      />
      <q-input
        v-model="password"
        outlined
        :type="showPassword ? 'text' : 'password'"
        label="Password"
        autocomplete="current-password"
        :rules="[(value) => Boolean(value) || 'Enter your password']"
        lazy-rules
        @keyup="capsLock = $event.getModifierState('CapsLock')"
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
      <span v-if="capsLock" class="auth-caps-warning">Caps Lock is on</span>

      <div class="auth-form__row">
        <q-checkbox :model-value="true" disable label="Keep me signed in" />
        <RouterLink class="auth-link" to="/auth/forgot-password">Forgot password?</RouterLink>
      </div>

      <div class="auth-form__actions">
        <AppButton type="submit" size="large" :loading="auth.loading">Sign in</AppButton>
      </div>
    </q-form>
    <p class="auth-form__footer">
      New here? <RouterLink class="auth-link" to="/auth/register">Create an account</RouterLink>
    </p>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';
import AuthMessage from '@/components/auth/AuthMessage.vue';
import AuthShell from '@/components/auth/AuthShell.vue';
import { useAuthStore } from '@/stores/auth.store';
import { safeInternalRedirect } from '@/router/auth-guard';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const capsLock = ref(false);

async function submit() {
  try {
    await auth.login({ email: email.value, password: password.value });
    await router.replace(
      auth.profile?.profile_completed
        ? safeInternalRedirect(route.query.redirect)
        : '/auth/profile-setup',
    );
  } catch {
    // Store exposes the safe, user-facing error.
  }
}
</script>
