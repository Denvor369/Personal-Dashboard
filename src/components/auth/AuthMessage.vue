<template>
  <div v-if="$slots.default" class="auth-message" :class="`auth-message--${tone}`" role="status">
    <q-icon :name="icon" aria-hidden="true" />
    <span><slot /></span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{ tone?: 'info' | 'error' | 'success' }>(), {
  tone: 'info',
});
const icon = computed(() =>
  props.tone === 'error' ? 'error_outline' : props.tone === 'success' ? 'check_circle' : 'info',
);
</script>
