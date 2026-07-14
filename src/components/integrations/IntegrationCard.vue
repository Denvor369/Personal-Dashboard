<template>
  <article class="integration-card hub-enter">
    <header class="integration-card__head">
      <span class="integration-card__icon" aria-hidden="true"><q-icon :name="service.icon" /></span>
      <span class="integration-card__name" :title="service.name">{{ service.name }}</span>
    </header>

    <p class="integration-card__desc">{{ service.description }}</p>

    <span v-if="service.account" class="integration-card__account">
      <q-icon name="account_circle" aria-hidden="true" />
      {{ service.account }}
      <small v-if="service.lastSynced">· synced {{ service.lastSynced }}</small>
    </span>

    <footer class="integration-card__footer">
      <span class="integration-card__status" :data-status="service.status">
        <span class="integration-card__dot" aria-hidden="true" />{{ statusLabel }}
      </span>
      <span :title="action.hint">
        <AppButton
          :variant="action.primary ? 'primary' : 'ghost'"
          size="small"
          :disabled="action.disabled"
          :aria-label="`${action.label} ${service.name}`"
          @click="runAction"
        >
          {{ action.label }}
        </AppButton>
      </span>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import type { Integration } from '@/data/integrations.mock';

const props = defineProps<{ service: Integration }>();
const emit = defineEmits<{
  connect: [service: Integration];
  details: [service: Integration];
}>();

const statusLabel = computed(() =>
  props.service.status === 'Not connected' && props.service.connectEnabled
    ? 'Ready to connect'
    : props.service.status,
);

// One action per card. The only primary (filled) button on the page is a real,
// working Connect — everything else stays quiet so it can't compete with it.
const action = computed<{
  label: string;
  event: 'connect' | 'details';
  primary: boolean;
  disabled: boolean;
  hint: string;
}>(() => {
  switch (props.service.status) {
    case 'Connected':
      return { label: 'Manage', event: 'connect', primary: false, disabled: false, hint: 'Open connection settings' };
    case 'Needs attention':
      return { label: 'Reconnect', event: 'connect', primary: true, disabled: false, hint: 'Re-authorize this connection' };
    case 'Error':
      return { label: 'Review issue', event: 'details', primary: false, disabled: false, hint: 'See what went wrong' };
    case 'Syncing':
      return { label: 'Syncing…', event: 'details', primary: false, disabled: true, hint: 'A sync is already in progress' };
    case 'Coming soon':
      return { label: 'Details', event: 'details', primary: false, disabled: false, hint: 'What this will bring to the dashboard' };
    default:
      return props.service.connectEnabled
        ? { label: 'Connect', event: 'connect', primary: true, disabled: false, hint: 'Link your account' }
        : { label: 'Details', event: 'details', primary: false, disabled: false, hint: 'Planned — not yet available' };
  }
});

function runAction() {
  if (action.value.event === 'connect') emit('connect', props.service);
  else emit('details', props.service);
}
</script>

<style scoped lang="scss">
.integration-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  height: 100%;
  padding: var(--space-3);
  border: var(--border-thin);
  border-radius: var(--radius-md);
  background: var(--color-surface-raised);
  transition: box-shadow var(--transition-base) var(--ease);
}
.integration-card:hover {
  box-shadow: var(--shadow-md);
}
.integration-card__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.integration-card__icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  place-items: center;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
  font-size: 1.2rem;
}
.integration-card__name {
  min-width: 0;
  overflow: hidden;
  font-family: var(--font-heading);
  font-size: 0.98rem;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.integration-card__desc {
  font-size: 0.8rem;
  line-height: 1.35;
  color: var(--color-text-secondary);
}
.integration-card__account {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.74rem;
}
.integration-card__account small {
  font-size: inherit;
}
.integration-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-top: auto;
  padding-top: var(--space-1);
}
.integration-card__status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-width: 0;
  overflow: hidden;
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.integration-card__dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-text) 30%, transparent);
}
.integration-card__status[data-status='Connected'] {
  color: var(--color-text-secondary);
}
.integration-card__status[data-status='Connected'] .integration-card__dot {
  background: var(--brand-mint);
}
.integration-card__status[data-status='Not connected'] .integration-card__dot {
  background: var(--brand-teal);
}
.integration-card__status[data-status='Syncing'] .integration-card__dot {
  background: var(--brand-teal);
}
.integration-card__status[data-status='Needs attention'] .integration-card__dot,
.integration-card__status[data-status='Error'] .integration-card__dot {
  background: var(--color-warning);
}
</style>
