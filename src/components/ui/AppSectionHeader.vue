<template>
  <header class="app-section-header">
    <div class="app-section-header__text">
      <h2 class="text-section-title">{{ title }}</h2>
      <p v-if="description" class="app-section-header__description text-body">{{ description }}</p>
    </div>
    <div v-if="$slots.action" class="app-section-header__action"><slot name="action" /></div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<style scoped lang="scss">
.app-section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-lg);
  flex-wrap: wrap;
  margin-bottom: var(--space-lg);
}
.app-section-header__description {
  margin-top: var(--space-xs);
  color: var(--color-text-muted);
}
.app-section-header__action {
  flex-shrink: 0;
}
</style>
