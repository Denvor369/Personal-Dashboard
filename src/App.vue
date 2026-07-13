<template>
  <div v-if="!auth.initialized" class="app-loading" role="status" aria-live="polite">
    <img class="app-loading__mark" src="/logo-mark.png" alt="" aria-hidden="true" />
    <strong>Opening your dashboard…</strong>
    <q-spinner-dots color="primary" size="32px" />
  </div>
  <router-view v-else />
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import { useTasksStore } from '@/modules/tasks/stores/tasks.store';

const auth = useAuthStore();
const tasks = useTasksStore();
void auth.initializeAuth();

// Bind user-scoped data to the session: clear first so one user's tasks never
// linger when another signs in, then load the signed-in user's tasks.
watch(
  () => auth.user?.id,
  (id, previous) => {
    if (id === previous) return;
    tasks.clear();
    if (id) void tasks.initialize();
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.app-loading {
  display: grid;
  min-height: 100dvh;
  place-content: center;
  place-items: center;
  gap: var(--space-3);
  color: var(--color-text);
  background: var(--color-background);
  font-family: var(--font-control);
}
.app-loading__mark {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
}
</style>
