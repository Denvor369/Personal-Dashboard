<template>
  <AuthShell>
    <header class="auth-card__heading">
      <p class="dashboard-eyebrow">A space of your own</p>
      <h2>Create account</h2>
      <p>Your dashboard data stays private to this account.</p>
    </header>

    <q-form class="auth-form" @submit.prevent="submit">
      <AuthMessage v-if="auth.error" tone="error">{{ auth.error }}</AuthMessage>
      <q-input
        v-model.trim="displayName"
        outlined
        label="Display name"
        autocomplete="name"
        maxlength="80"
        :rules="[(value) => Boolean(value) || 'Enter your display name']"
        lazy-rules
      />
      <q-input
        v-model.trim="email"
        outlined
        type="email"
        label="Email"
        autocomplete="email"
        inputmode="email"
        :rules="[(value) => /.+@.+\..+/.test(value) || 'Enter a valid email address']"
        lazy-rules
      />
      <q-input
        v-model="password"
        outlined
        :type="showPassword ? 'text' : 'password'"
        label="Password"
        autocomplete="new-password"
        :rules="[(value) => value.length >= 8 || 'Use at least 8 characters']"
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
      <PasswordStrength :password="password" />
      <q-input
        v-model="confirmPassword"
        outlined
        type="password"
        label="Confirm password"
        autocomplete="new-password"
        :rules="[(value) => value === password || 'Passwords do not match']"
        lazy-rules
      />
      <span v-if="capsLock" class="auth-caps-warning">Caps Lock is on</span>
      <q-checkbox
        v-model="acceptedTerms"
        label="I agree to use this private dashboard responsibly"
      />
      <div class="auth-form__actions">
        <AppButton type="submit" size="large" :loading="auth.loading" :disabled="!acceptedTerms"
          >Create account</AppButton
        >
      </div>
    </q-form>
    <p class="auth-form__footer">
      Already have an account? <RouterLink class="auth-link" to="/auth/login">Sign in</RouterLink>
    </p>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';
import AuthMessage from '@/components/auth/AuthMessage.vue';
import AuthShell from '@/components/auth/AuthShell.vue';
import PasswordStrength from '@/components/auth/PasswordStrength.vue';
import { useAuthStore } from '@/stores/auth.store';

const auth = useAuthStore();
const router = useRouter();
const displayName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const capsLock = ref(false);
const acceptedTerms = ref(false);

async function submit() {
  if (!acceptedTerms.value || password.value !== confirmPassword.value) return;
  try {
    const data = await auth.register({
      displayName: displayName.value,
      email: email.value,
      password: password.value,
    });
    await router.replace(data.session ? '/auth/profile-setup' : '/auth/verify');
  } catch {
    // Store exposes the safe, user-facing error.
  }
}
</script>
