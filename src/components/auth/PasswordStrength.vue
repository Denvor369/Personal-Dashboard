<template>
  <div class="password-strength" aria-live="polite">
    <div class="password-strength__label">
      <span>Password strength</span><strong>{{ label }}</strong>
    </div>
    <q-linear-progress rounded size="6px" :value="score / 4" color="primary" track-color="grey-4" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ password: string }>();
const score = computed(
  () =>
    [
      props.password.length >= 8,
      /[a-z]/.test(props.password) && /[A-Z]/.test(props.password),
      /\d/.test(props.password),
      /[^A-Za-z0-9]/.test(props.password),
    ].filter(Boolean).length,
);
const label = computed(() => ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][score.value]);
</script>
