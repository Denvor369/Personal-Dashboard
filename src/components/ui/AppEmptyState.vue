<template>
  <div class="app-empty-state" role="status">
    <div class="app-empty-state__icon" aria-hidden="true">
      <q-icon :name="icon" />
    </div>
    <h3 class="app-empty-state__title text-card-title">{{ title }}</h3>
    <p v-if="description" class="app-empty-state__description text-body">{{ description }}</p>
    <div v-if="$slots.action" class="app-empty-state__action"><slot name="action" /></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  title: string;
  description?: string;
}>();
</script>

<style scoped lang="scss">
.app-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-3xl) var(--space-xl);
  color: var(--color-text);
}
.app-empty-state__icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin-bottom: var(--space-lg);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--color-primary) 16%, transparent);
  color: var(--color-primary);
  font-size: 2rem;
}
.app-empty-state__description {
  margin-top: var(--space-xs);
  max-width: 42ch;
  color: var(--color-text-muted);
}
.app-empty-state__action {
  margin-top: var(--space-xl);
}
</style>
