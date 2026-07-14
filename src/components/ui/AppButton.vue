<template>
  <button
    class="app-btn font-interactive"
    :class="[`app-btn--${variant}`, `app-btn--${size}`, { 'app-btn--loading': loading }]"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    @click="emit('click', $event)"
  >
    <span v-if="loading" class="app-btn__spinner" aria-hidden="true" />
    <q-icon v-if="iconLeft && !loading" :name="iconLeft" class="app-btn__icon" />
    <span class="app-btn__label"><slot /></span>
    <q-icon v-if="iconRight" :name="iconRight" class="app-btn__icon" />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'dark' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    type?: 'button' | 'submit' | 'reset';
    loading?: boolean;
    disabled?: boolean;
    iconLeft?: string;
    iconRight?: string;
  }>(),
  {
    variant: 'primary',
    size: 'medium',
    type: 'button',
    loading: false,
    disabled: false,
    iconLeft: '',
    iconRight: '',
  },
);

const emit = defineEmits<{ click: [event: MouseEvent] }>();
</script>

<style scoped lang="scss">
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  border-radius: var(--radius-pill);
  border: var(--border-width) solid transparent;
  font-weight: 400;
  line-height: 1;
  white-space: nowrap;
  transition:
    background-color var(--transition-base) var(--ease),
    color var(--transition-base) var(--ease),
    border-color var(--transition-base) var(--ease),
    transform var(--transition-fast) var(--ease);
}
.app-btn:active:not(:disabled) {
  transform: translateY(1px) scale(var(--scale-press));
}
.app-btn:disabled {
  opacity: 0.55;
}

// Sizes
.app-btn--small {
  padding: 0 var(--space-md);
  height: 34px;
  font-size: 0.8125rem;
}
.app-btn--medium {
  padding: 0 var(--space-lg);
  height: 44px;
  font-size: 0.9375rem;
}
.app-btn--large {
  padding: 0 var(--space-xl);
  height: 52px;
  font-size: 1.0625rem;
}

// Variants
.app-btn--primary {
  background: var(--color-button-primary-bg);
  color: var(--color-button-primary-text);
}
.app-btn--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}
.app-btn--secondary {
  background: var(--color-button-secondary-bg);
  color: var(--color-button-secondary-text);
}
.app-btn--secondary:hover:not(:disabled) {
  background: var(--color-button-secondary-hover);
}
.app-btn--dark {
  background: var(--color-strong-surface);
  color: var(--color-on-strong-surface);
  border-color: var(--color-border);
}
.app-btn--dark:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-strong-surface) 86%, var(--color-primary));
}
.app-btn--ghost {
  background: transparent;
  color: var(--color-primary);
  border-color: var(--color-border);
}
.app-btn--ghost:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
}

.app-btn__icon {
  font-size: 1.2em;
}
.app-btn__label:empty {
  display: none;
}

.app-btn__spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: app-btn-spin 0.6s linear infinite;
}
@keyframes app-btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
