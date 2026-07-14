<template>
  <header class="dashboard-page-header">
    <div>
      <p class="dashboard-eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <p class="dashboard-page-header__description">{{ description }}</p>
    </div>
    <div v-if="$slots.action" class="dashboard-page-header__action"><slot name="action" /></div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow: string;
  title: string;
  description: string;
}>();
</script>

<style scoped lang="scss">
.dashboard-page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  min-height: 82px;
}

.dashboard-page-header h1 {
  margin-top: 2px;
  font-size: clamp(1.85rem, 2.6vw, 2.4rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
}

.dashboard-page-header__description {
  max-width: 62ch;
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.86rem;
  font-style: italic;
  line-height: 1.35;
}

.dashboard-page-header__action {
  flex-shrink: 0;
}

@media (max-width: 767px) {
  .dashboard-page-header {
    align-items: stretch;
    flex-direction: column;
    min-height: 0;
  }

  .dashboard-page-header h1 {
    font-size: clamp(1.85rem, 9vw, 2.35rem);
  }

  .dashboard-page-header__action :deep(.app-btn) {
    width: 100%;
  }
}
</style>
