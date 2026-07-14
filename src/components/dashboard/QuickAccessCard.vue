<template>
  <article class="dashboard-card quick-access-card">
    <header class="quick-access-card__header">
      <div>
        <p class="dashboard-eyebrow">Keep close</p>
        <h2>Quick access</h2>
      </div>
      <q-btn flat rounded dense no-caps label="Open notes" icon-right="arrow_forward" to="/notes" />
    </header>

    <div class="quick-access-card__list">
      <div
        v-for="item in quickAccessItems.slice(0, 3)"
        :key="item.id"
        class="quick-access-item t-acc"
        :data-open="openItem === item.id"
      >
        <button
          type="button"
          class="quick-access-item__summary"
          :aria-expanded="openItem === item.id"
          @click="toggleItem(item.id)"
        >
          <span class="quick-access-item__icon"><q-icon :name="item.icon" /></span>
          <span>{{ item.label }}</span>
          <q-icon class="quick-access-item__chevron t-acc-chevron" name="keyboard_arrow_down" />
        </button>
        <div class="t-acc-panel">
          <div class="t-acc-panel-inner">
            <p>{{ item.detail }}</p>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { quickAccessItems } from '@/data/dashboard.mock';

const openItem = ref<string | null>(quickAccessItems[0]?.id ?? null);
function toggleItem(id: string) {
  openItem.value = openItem.value === id ? null : id;
}
</script>

<style scoped lang="scss">
.quick-access-card {
  gap: var(--space-2);
  min-height: 0;
  color: var(--color-on-quick-card);
  background: var(--color-quick-card);
}

.quick-access-card h2 {
  margin: 2px 0 0;
  font-size: clamp(1.125rem, 1.5vw, 1.375rem);
  font-weight: 700;
}

.quick-access-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
}

.quick-access-card__header .q-btn {
  color: var(--color-on-quick-card);
  font-size: 0.72rem;
}

.quick-access-card__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border: var(--border-thin);
  border-radius: var(--radius-md);
}

.quick-access-item {
  color: var(--color-text);
  background: var(--color-surface);
}

.quick-access-item + .quick-access-item {
  border-top: var(--border-thin);
}

.quick-access-item__summary {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  list-style: none;
  text-align: left;
  transition: background-color var(--duration-fast) var(--ease-smooth-out);
}

.quick-access-item__summary:hover {
  background: var(--color-surface-soft);
}

.quick-access-item__summary[aria-expanded='true'] {
  background: var(--color-surface-raised);
}

.quick-access-item__icon {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 50%;
  color: var(--color-on-primary);
  background: var(--color-primary);
}

.quick-access-item p {
  margin: 0;
  padding: 0 var(--space-3) var(--space-3) 4.3rem;
  font-size: 0.8rem;
  font-style: italic;
}

@media (max-height: 800px) and (min-width: 1101px) {
  .quick-access-card {
    padding: var(--space-3);
  }

  .quick-access-item__summary {
    min-height: 40px;
    padding-block: var(--space-1);
  }

  .quick-access-item__icon {
    width: 30px;
    height: 30px;
  }

  .quick-access-item p {
    padding: 0 var(--space-2) var(--space-2) 3.6rem;
    font-size: 0.72rem;
  }
}
</style>
