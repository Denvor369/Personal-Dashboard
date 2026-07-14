<template>
  <div
    v-if="variant === 'text'"
    class="app-skeleton__lines"
    role="status"
    aria-busy="true"
    aria-label="Loading"
  >
    <span
      v-for="n in lines"
      :key="n"
      class="app-skeleton app-skeleton--text"
      :style="lineStyle(n)"
    />
  </div>
  <div
    v-else
    class="app-skeleton"
    :class="`app-skeleton--${variant}`"
    :style="sizeStyle"
    role="status"
    aria-busy="true"
    aria-label="Loading"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CSSProperties } from 'vue';

const props = withDefaults(
  defineProps<{
    variant?: 'card' | 'text' | 'circular';
    width?: string;
    height?: string;
    lines?: number;
  }>(),
  {
    variant: 'text',
    width: '',
    height: '',
    lines: 3,
  },
);

const sizeStyle = computed<CSSProperties>(() => ({
  ...(props.width ? { inlineSize: props.width } : {}),
  ...(props.height ? { blockSize: props.height } : {}),
}));

// Last line is shorter, for a natural paragraph feel.
function lineStyle(n: number): CSSProperties {
  return n === props.lines ? { inlineSize: '60%' } : {};
}
</script>

<style scoped lang="scss">
.app-skeleton {
  display: block;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-text) 8%, transparent) 25%,
    color-mix(in srgb, var(--color-text) 14%, transparent) 37%,
    color-mix(in srgb, var(--color-text) 8%, transparent) 63%
  );
  background-size: 400% 100%;
  animation: app-skeleton-shimmer 1.4s ease infinite;
}

.app-skeleton--text {
  height: 0.9rem;
  border-radius: var(--radius-sm);
}
.app-skeleton--card {
  inline-size: 100%;
  block-size: 160px;
  border-radius: var(--radius-md);
}
.app-skeleton--circular {
  inline-size: 48px;
  block-size: 48px;
  border-radius: var(--radius-pill);
}

.app-skeleton__lines {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

@keyframes app-skeleton-shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-skeleton {
    animation: none;
    background: color-mix(in srgb, var(--color-text) 8%, transparent);
  }
}
</style>
