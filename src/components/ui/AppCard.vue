<template>
  <section
    class="app-card"
    :class="[`app-card--${variant}`, `app-card--pad-${padding}`, `app-card--radius-${radius}`]"
    :aria-labelledby="title ? headingId : undefined"
  >
    <header v-if="title || $slots.action" class="app-card__header">
      <h3 v-if="title" :id="headingId" class="app-card__title text-card-title">{{ title }}</h3>
      <div v-if="$slots.action" class="app-card__action"><slot name="action" /></div>
    </header>
    <slot />
  </section>
</template>

<script setup lang="ts">
import { useId } from 'vue';

withDefaults(
  defineProps<{
    variant?: 'cream' | 'mint' | 'teal' | 'dark';
    title?: string;
    padding?: 'none' | 'small' | 'medium' | 'large';
    radius?: 'sm' | 'md' | 'lg' | 'outer';
  }>(),
  {
    variant: 'cream',
    title: '',
    padding: 'medium',
    radius: 'md',
  },
);

const headingId = useId();
</script>

<style scoped lang="scss">
.app-card {
  border: var(--border-thin);
  box-shadow: var(--shadow-sm);
  color: var(--color-text);
}

// Variants
.app-card--cream {
  background: var(--color-surface);
}
.app-card--mint {
  background: var(--brand-mint);
  color: var(--brand-deep);
  border-color: transparent;
}
.app-card--teal {
  background: var(--color-secondary);
  color: var(--color-on-secondary);
  border-color: transparent;
}
.app-card--dark {
  background: var(--color-strong-surface);
  color: var(--color-on-strong-surface);
  border-color: transparent;
}

// Radius
.app-card--radius-sm {
  border-radius: var(--radius-sm);
}
.app-card--radius-md {
  border-radius: var(--radius-md);
}
.app-card--radius-lg {
  border-radius: var(--radius-lg);
}
.app-card--radius-outer {
  border-radius: var(--radius-outer);
}

// Padding
.app-card--pad-none {
  padding: 0;
}
.app-card--pad-small {
  padding: var(--space-md);
}
.app-card--pad-medium {
  padding: var(--space-xl);
}
.app-card--pad-large {
  padding: var(--space-2xl);
}

.app-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}
.app-card__action {
  flex-shrink: 0;
}
</style>
