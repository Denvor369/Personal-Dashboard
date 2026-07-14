<template>
  <AuthShell>
    <header class="auth-card__heading">
      <p class="dashboard-eyebrow">Email verification</p>
      <h2>{{ verified ? 'Email verified' : 'Check your inbox' }}</h2>
      <p>
        {{
          verified
            ? 'Your account is ready for profile setup.'
            : 'Open the verification link on this device to finish creating your account.'
        }}
      </p>
    </header>
    <div class="auth-form">
      <AuthMessage :tone="verified ? 'success' : 'info'">
        {{
          verified
            ? 'Verification complete. Your private dashboard is protected.'
            : 'You can close this page after opening the link in your email.'
        }}
      </AuthMessage>
      <div class="auth-form__actions">
        <AppButton v-if="verified" size="large" @click="router.replace('/auth/profile-setup')"
          >Set up profile</AppButton
        >
        <AppButton v-else variant="ghost" size="large" @click="router.replace('/auth/login')"
          >Back to sign in</AppButton
        >
      </div>
    </div>
  </AuthShell>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';
import AuthMessage from '@/components/auth/AuthMessage.vue';
import AuthShell from '@/components/auth/AuthShell.vue';
import { useAuthStore } from '@/stores/auth.store';

const auth = useAuthStore();
const router = useRouter();
const verified = computed(() => Boolean(auth.user?.email_confirmed_at));
</script>
