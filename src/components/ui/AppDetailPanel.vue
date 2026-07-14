<template>
  <q-dialog v-model="open" :position="$q.screen.gt.sm ? 'right' : 'bottom'">
    <q-card class="app-detail-panel">
      <header class="app-detail-panel__header">
        <div>
          <p v-if="eyebrow" class="dashboard-eyebrow">{{ eyebrow }}</p>
          <h2>{{ title }}</h2>
          <p v-if="description">{{ description }}</p>
        </div>
        <AppIconButton icon="close" label="Close panel" @click="open = false" />
      </header>
      <div class="app-detail-panel__content"><slot /></div>
      <footer v-if="$slots.actions" class="app-detail-panel__actions">
        <slot name="actions" />
      </footer>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import AppIconButton from '@/components/ui/AppIconButton.vue';

defineProps<{
  eyebrow?: string;
  title: string;
  description?: string;
}>();

const open = defineModel<boolean>({ required: true });
</script>

<style scoped lang="scss">
.app-detail-panel {
  display: flex;
  width: min(440px, 100vw);
  height: 100dvh;
  flex-direction: column;
  color: var(--color-text);
  background: var(--color-surface);
  border-left: var(--border-thin);
}

.app-detail-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5);
  border-bottom: var(--border-thin);
}

.app-detail-panel__header h2 {
  margin-top: var(--space-1);
  font-size: 2rem;
  font-weight: 400;
  line-height: 1.05;
}

.app-detail-panel__header p:last-child {
  margin-top: var(--space-2);
  color: var(--color-text-muted);
}

.app-detail-panel__content {
  flex: 1;
  min-height: 0;
  padding: var(--space-5);
  overflow-y: auto;
}

.app-detail-panel__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5);
  border-top: var(--border-thin);
}

@media (max-width: 767px) {
  .app-detail-panel {
    width: 100vw;
    height: min(88dvh, 720px);
    border: var(--border-thin);
    border-bottom: 0;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .app-detail-panel__header,
  .app-detail-panel__content {
    padding: var(--space-4);
  }
}
</style>
