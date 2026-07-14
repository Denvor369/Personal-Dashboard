<template>
  <div class="app-progress">
    <div
      class="app-progress__track"
      role="progressbar"
      :aria-valuenow="clamped"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="label || undefined"
    >
      <div
        class="app-progress__fill"
        :class="`app-progress__fill--${variant}`"
        :style="{ inlineSize: `${clamped}%` }"
      />
    </div>
    <span v-if="showPercentage" class="app-progress__value font-interactive">{{ clamped }}%</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    value: number;
    variant?: 'primary' | 'mint' | 'teal' | 'dark';
    showPercentage?: boolean;
    label?: string;
  }>(),
  {
    variant: 'primary',
    showPercentage: false,
    label: '',
  },
);

const clamped = computed(() => Math.round(Math.min(100, Math.max(0, props.value))));
</script>

<style scoped lang="scss">
.app-progress {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}
.app-progress__track {
  flex: 1;
  height: 10px;
  // Neutral tint (not surface-accent, which is full mint and would hide the mint fill).
  border: 1px solid var(--color-border);
  background: var(--color-progress-track);
  border-radius: var(--radius-pill);
  overflow: hidden;
}
.app-progress__fill {
  height: 100%;
  border-radius: var(--radius-pill);
  transition: inline-size var(--transition-slow) var(--ease);
}
.app-progress__fill--primary,
.app-progress__fill--mint {
  background: var(--color-progress-fill);
}
.app-progress__fill--teal {
  background: var(--color-secondary);
}
.app-progress__fill--dark {
  background: var(--color-strong-surface);
}
.app-progress__value {
  min-width: 3ch;
  text-align: right;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}
</style>
