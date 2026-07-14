<template>
  <span class="app-badge font-interactive" :class="[`app-badge--${variant}`, `app-badge--${size}`]">
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'neutral' | 'mint' | 'teal' | 'dark';
    size?: 'compact' | 'normal';
  }>(),
  {
    variant: 'neutral',
    size: 'normal',
  },
);
</script>

<style scoped lang="scss">
.app-badge {
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-pill);
  line-height: 1;
  white-space: nowrap;
  border: var(--border-width) solid transparent;
}
.app-badge--compact {
  padding: 3px var(--space-sm);
  font-size: 0.6875rem;
}
.app-badge--normal {
  padding: 5px var(--space-md);
  font-size: 0.75rem;
}

.app-badge--neutral {
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
  color: var(--color-text);
}
.app-badge--mint {
  background: var(--brand-mint);
  color: var(--brand-deep);
}
.app-badge--teal {
  background: var(--color-secondary);
  color: var(--color-on-secondary);
}
.app-badge--dark {
  background: var(--color-strong-surface);
  color: var(--color-on-strong-surface);
}
</style>
