<template>
  <span class="data-sync" :class="`data-sync--${state.tone}`" role="status" :title="title">
    <span class="data-sync__dot" aria-hidden="true" />
    {{ state.label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    online?: boolean;
    saving?: boolean;
    error?: string;
    lastSyncedAt?: string | null;
  }>(),
  { online: true, saving: false, error: '', lastSyncedAt: null },
);

function agoLabel(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'Last synced a moment ago';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `Last synced ${minutes}m ago`;
  return `Last synced ${Math.round(minutes / 60)}h ago`;
}

const state = computed(() => {
  if (!props.online) return { tone: 'offline', label: 'Offline' };
  if (props.saving) return { tone: 'saving', label: 'Saving…' };
  if (props.error) return { tone: 'error', label: 'Sync failed' };
  if (props.lastSyncedAt) return { tone: 'saved', label: agoLabel(props.lastSyncedAt) };
  return { tone: 'saved', label: 'Saved' };
});

const title = computed(() => (props.error ? props.error : state.value.label));
</script>

<style scoped lang="scss">
.data-sync {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-control);
  font-size: 0.68rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}
.data-sync__dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-pill);
  background: currentColor;
}
.data-sync--saved {
  color: var(--color-primary);
}
.data-sync--saving .data-sync__dot {
  animation: data-sync-pulse 1s ease-in-out infinite;
}
.data-sync--offline {
  color: var(--color-text-muted);
}
.data-sync--error {
  color: var(--color-warning);
}
@keyframes data-sync-pulse {
  50% {
    opacity: 0.3;
  }
}
</style>
