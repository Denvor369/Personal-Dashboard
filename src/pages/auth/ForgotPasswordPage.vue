<template>
  <AuthShell>
    <header class="auth-card__heading">
      <p class="dashboard-eyebrow">Password help</p>
      <h2>Reset password</h2>
      <p>We’ll send a secure reset link if the account can receive one.</p>
    </header>

    <q-form v-if="!sent" class="auth-form" @submit.prevent="submit">
      <AuthMessage v-if="auth.error" tone="error">{{ auth.error }}</AuthMessage>
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
      <div class="auth-form__actions">
        <AppButton type="submit" size="large" :loading="auth.loading">Send reset link</AppButton>
      </div>
    </q-form>
    <div v-else class="auth-form">
      <AuthMessage tone="success"
        >If an account matches that address, a reset link is on its way.</AuthMessage
      >
    </div>
    <p class="auth-form__footer">
      <RouterLink class="auth-link" to="/auth/login">Back to sign in</RouterLink>
    </p>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import AuthMessage from '@/components/auth/AuthMessage.vue';
import AuthShell from '@/components/auth/AuthShell.vue';
import { useAuthStore } from '@/stores/auth.store';

const auth = useAuthStore();
const email = ref('');
const sent = ref(false);

async function submit() {
  try {
    await auth.requestPasswordReset(email.value);
    sent.value = true;
  } catch {
    // The safe error does not reveal whether an account exists.
  }
}
</script>
