<template>
  <nav ref="container" class="mobile-dashboard-nav t-tabs" aria-label="Mobile dashboard navigation">
    <span ref="indicator" class="t-tabs-pill" aria-hidden="true" />
    <RouterLink
      to="/"
      class="mobile-dashboard-nav__item t-tab"
      exact-active-class="mobile-dashboard-nav__item--active"
    >
      <q-icon name="home" /><span>Home</span>
    </RouterLink>
    <RouterLink
      to="/tasks"
      class="mobile-dashboard-nav__item t-tab"
      exact-active-class="mobile-dashboard-nav__item--active"
    >
      <q-icon name="check_circle_outline" /><span>Tasks</span>
    </RouterLink>
    <button
      class="mobile-dashboard-nav__add"
      type="button"
      aria-label="Quick create"
      @click="createOpen = true"
    >
      <q-icon name="add" /><span class="sr-only">Add</span>
    </button>
    <RouterLink
      to="/calendar"
      class="mobile-dashboard-nav__item t-tab"
      exact-active-class="mobile-dashboard-nav__item--active"
    >
      <q-icon name="calendar_month" /><span>Calendar</span>
    </RouterLink>
    <button
      class="mobile-dashboard-nav__item t-tab"
      :class="{ 'mobile-dashboard-nav__item--active': moreActive }"
      :aria-current="moreActive ? 'page' : undefined"
      type="button"
      aria-label="More navigation"
      @click="moreOpen = true"
    >
      <q-icon name="more_horiz" /><span>More</span>
    </button>
  </nav>

  <q-dialog v-model="createOpen" position="bottom">
    <q-card class="mobile-action-sheet">
      <header>
        <div>
          <p class="dashboard-eyebrow">Quick create</p>
          <h2>Add something new</h2>
        </div>
        <AppIconButton icon="close" label="Close quick create" @click="createOpen = false" />
      </header>
      <div class="mobile-action-sheet__grid">
        <button
          v-for="item in createItems"
          :key="item.label"
          type="button"
          @click="openRoute(item.path)"
        >
          <q-icon :name="item.icon" /><span>{{ item.label }}</span>
        </button>
      </div>
    </q-card>
  </q-dialog>

  <q-dialog v-model="moreOpen" position="bottom">
    <q-card class="mobile-action-sheet">
      <header>
        <div>
          <p class="dashboard-eyebrow">Navigation</p>
          <h2>More places</h2>
        </div>
        <AppIconButton icon="close" label="Close navigation" @click="moreOpen = false" />
      </header>
      <q-list>
        <q-item v-for="item in moreItems" :key="item.label" clickable @click="openRoute(item.path)">
          <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
          <q-item-section side><q-icon name="arrow_forward" /></q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIconButton from '@/components/ui/AppIconButton.vue';
import { useSlidingRouteIndicator } from '@/composables/useSlidingRouteIndicator';

const route = useRoute();
const router = useRouter();
const { container, indicator } = useSlidingRouteIndicator();
const createOpen = ref(false);
const moreOpen = ref(false);
const createItems = [
  { label: 'Task', path: '/tasks', icon: 'task_alt' },
  { label: 'Note', path: '/notes', icon: 'edit_note' },
  { label: 'Event', path: '/calendar', icon: 'event' },
  { label: 'Project', path: '/projects', icon: 'work_outline' },
];
const moreItems = [
  { label: 'Projects', path: '/projects', icon: 'work_outline' },
  { label: 'Notes', path: '/notes', icon: 'notes' },
  { label: 'Learn', path: '/learn', icon: 'school' },
  { label: 'Career', path: '/career', icon: 'work_history' },
  { label: 'Goals', path: '/goals', icon: 'flag' },
  { label: 'Websites', path: '/websites', icon: 'language' },
  { label: 'Bank', path: '/bank', icon: 'account_balance_wallet' },
  { label: 'Timeline', path: '/timeline', icon: 'history' },
  { label: 'Connected Apps', path: '/connected-apps', icon: 'hub' },
  { label: 'Agency', path: '/agency', icon: 'business_center' },
  { label: 'Settings', path: '/settings', icon: 'settings' },
];
const moreActive = computed(() => moreItems.some((item) => item.path === route.path));

function openRoute(path: string) {
  createOpen.value = false;
  moreOpen.value = false;
  void router.push(path);
}
</script>

<style scoped lang="scss">
.mobile-dashboard-nav {
  position: fixed;
  z-index: 1000;
  right: var(--space-3);
  bottom: calc(var(--space-3) + env(safe-area-inset-bottom));
  left: var(--space-3);
  display: none;
  grid-template-columns: 1fr 1fr auto 1fr 1fr;
  align-items: center;
  min-height: 70px;
  padding: var(--space-2);
  border: var(--border-thin);
  border-radius: var(--radius-pill);
  background: var(--color-nav-bg);
  box-shadow: var(--shadow-md);
}

.mobile-dashboard-nav__item {
  display: flex;
  min-width: 44px;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex-direction: column;
  color: var(--color-text-secondary);
  font-family: var(--font-control);
  font-size: 0.64rem;
  text-decoration: none;
}

.mobile-dashboard-nav__item .q-icon {
  font-size: 1.3rem;
}

.mobile-dashboard-nav__item--active {
  color: var(--color-nav-active-text);
}

.mobile-dashboard-nav .t-tabs-pill {
  border-radius: var(--radius-md);
}

.mobile-dashboard-nav__add {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  margin: -28px var(--space-2) 0;
  border: 3px solid var(--color-shell);
  border-radius: 50%;
  color: var(--color-button-primary-text);
  background: var(--color-button-primary-bg);
}

.mobile-dashboard-nav__add:active {
  filter: brightness(0.92);
}

.mobile-dashboard-nav__add .q-icon {
  font-size: 1.8rem;
}

.mobile-action-sheet {
  width: 100%;
  max-width: none;
  padding: var(--space-4);
  color: var(--color-text);
  background: var(--color-surface);
  border: var(--border-thin);
  border-bottom: 0;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.mobile-action-sheet > header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.mobile-action-sheet h2 {
  font-size: 1.75rem;
  font-weight: 400;
}

.mobile-action-sheet__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
}

.mobile-action-sheet__grid button {
  display: flex;
  min-height: 82px;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  flex-direction: column;
  border: var(--border-thin);
  border-radius: var(--radius-md);
}

.mobile-action-sheet__grid .q-icon {
  font-size: 1.5rem;
}

@media (max-width: 800px) {
  .mobile-dashboard-nav {
    display: grid;
  }
}
</style>
