<template>
  <button
    class="app-icon-btn"
    :class="[`app-icon-btn--${size}`, { 'app-icon-btn--active': active }]"
    :type="type"
    :disabled="disabled"
    :aria-label="label"
    :aria-pressed="active || undefined"
    @click="emit('click', $event)"
  >
    <q-icon :name="icon" class="app-icon-btn__icon" />
    <q-tooltip v-if="tooltip" :offset="[0, 6]">{{ label }}</q-tooltip>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon: string;
    label: string;
    size?: 'small' | 'medium';
    type?: 'button' | 'submit' | 'reset';
    tooltip?: boolean;
    active?: boolean;
    disabled?: boolean;
  }>(),
  {
    size: 'medium',
    type: 'button',
    tooltip: true,
    active: false,
    disabled: false,
  },
);

const emit = defineEmits<{ click: [event: MouseEvent] }>();
</script>

<style scoped lang="scss">
.app-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--color-text);
  transition:
    background-color var(--transition-base) var(--ease),
    color var(--transition-base) var(--ease);
}
.app-icon-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
}
.app-icon-btn--active {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
.app-icon-btn:disabled {
  opacity: 0.5;
}

.app-icon-btn--small {
  width: 32px;
  height: 32px;
}
.app-icon-btn--small .app-icon-btn__icon {
  font-size: 1.125rem;
}
.app-icon-btn--medium {
  width: 44px;
  height: 44px;
}
.app-icon-btn--medium .app-icon-btn__icon {
  font-size: 1.375rem;
}
</style>
