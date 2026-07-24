<template>
  <!-- Global quick-add button. Desktop → palette in Create mode; mobile → bottom sheet. -->
  <button
    type="button"
    class="quick-add-fab font-interactive"
    aria-label="Quick add"
    @click="onFab"
  >
    <q-icon name="add" />
  </button>

  <q-dialog v-model="quickAddSheetOpen" position="bottom" class="quick-add-dialog">
    <q-card class="quick-add-sheet" aria-label="Quick add">
      <div class="quick-add-sheet__grip" aria-hidden="true" />
      <header class="quick-add-sheet__header">
        <h2>Quick add</h2>
        <p>Create something new.</p>
      </header>
      <ul class="quick-add-sheet__list">
        <li v-for="option in quickAddOptions" :key="option.type">
          <button
            type="button"
            class="quick-add-option"
            :class="{ 'quick-add-option--soon': option.comingSoon }"
            @click="pick(option)"
          >
            <q-icon :name="option.icon" class="quick-add-option__icon" aria-hidden="true" />
            <span class="quick-add-option__text">
              <span class="quick-add-option__label">{{ option.label }}</span>
              <span class="quick-add-option__desc">{{ option.description }}</span>
            </span>
            <span v-if="option.comingSoon" class="quick-add-option__badge">Soon</span>
            <q-icon v-else name="chevron_right" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useCommandPalette } from '@/composables/useCommandPalette';
import { quickAddOptions, type QuickAddOption } from '@/data/command.registry';

const router = useRouter();
const $q = useQuasar();
const { openPalette, openQuickAddSheet, closeQuickAddSheet, quickAddSheetOpen } =
  useCommandPalette();

function onFab() {
  if ($q.screen.gt.sm) openPalette('create');
  else openQuickAddSheet();
}

function pick(option: QuickAddOption) {
  if (option.comingSoon || !option.route) {
    $q.notify({ message: `${option.label} isn’t available yet`, timeout: 1500 });
    return;
  }
  closeQuickAddSheet();
  void router.push(option.route);
}
</script>

<style scoped lang="scss">
.quick-add-fab {
  position: fixed;
  right: var(--space-4);
  bottom: var(--space-4);
  z-index: 2000;
  display: flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  color: var(--color-button-primary-text);
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-md);
  transition:
    transform var(--transition-fast) var(--ease),
    background-color var(--transition-base) var(--ease);
}
.quick-add-fab:hover {
  background: var(--color-primary-hover);
}
.quick-add-fab:active {
  transform: scale(var(--scale-press));
}
.quick-add-fab .q-icon {
  font-size: 1.6rem;
}
@media (max-width: 800px) {
  .quick-add-fab {
    display: none;
  }
}

.quick-add-sheet {
  width: 100vw;
  max-width: 640px;
  padding: var(--space-3) var(--space-4) var(--space-5);
  color: var(--color-text);
  background: var(--color-surface);
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
}
.quick-add-sheet__grip {
  width: 40px;
  height: 4px;
  margin: 0 auto var(--space-3);
  background: color-mix(in srgb, var(--color-text) 22%, transparent);
  border-radius: var(--radius-pill);
}
.quick-add-sheet__header h2 {
  font-family: var(--font-heading);
  font-size: 1.25rem;
}
.quick-add-sheet__header p {
  margin-top: 2px;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}
.quick-add-sheet__list {
  display: flex;
  margin-top: var(--space-3);
  flex-direction: column;
  gap: var(--space-1);
  list-style: none;
}
.quick-add-option {
  display: flex;
  width: 100%;
  min-height: 56px;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  color: var(--color-text);
  text-align: left;
  border-radius: var(--radius-md);
}
.quick-add-option:hover {
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
}
.quick-add-option--soon {
  opacity: 0.6;
}
.quick-add-option__icon {
  font-size: 1.4rem;
  color: var(--color-primary);
}
.quick-add-option__text {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.quick-add-option__label {
  font-size: 0.95rem;
}
.quick-add-option__desc {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.quick-add-option__badge {
  padding: 2px var(--space-2);
  color: var(--color-warning);
  font-family: var(--font-control);
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  background: color-mix(in srgb, var(--color-warning) 16%, transparent);
  border-radius: var(--radius-pill);
}
</style>
