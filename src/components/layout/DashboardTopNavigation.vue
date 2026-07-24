<template>
  <header class="dashboard-header">
    <RouterLink class="dashboard-header__brand" to="/" aria-label="Personal Dashboard home">
      <img class="dashboard-header__brand-mark" src="/logo-mark.png" alt="" aria-hidden="true" />
      <span class="dashboard-header__brand-text">Personal Dashboard</span>
    </RouterLink>

    <nav ref="container" class="dashboard-header__nav t-tabs" aria-label="Primary navigation">
      <span ref="indicator" class="t-tabs-pill" aria-hidden="true" />
      <RouterLink
        v-for="item in navigation"
        :key="item.path"
        :to="item.path"
        class="dashboard-header__nav-link t-tab"
        :class="{ 'dashboard-header__nav-link--active': route.path === item.path }"
        :aria-current="route.path === item.path ? 'page' : undefined"
      >
        {{ item.label }}
      </RouterLink>
      <button
        type="button"
        class="dashboard-header__nav-link dashboard-header__nav-more t-tab"
        :class="{
          'dashboard-header__nav-link--active': moreActive,
          'dashboard-header__nav-more--open': moreOpen,
        }"
        :aria-current="moreActive ? 'page' : undefined"
        :aria-expanded="moreOpen"
        aria-haspopup="menu"
      >
        More <q-icon name="expand_more" size="18px" aria-hidden="true" />
        <q-menu v-model="moreOpen" anchor="bottom right" self="top right" :offset="[0, 8]">
          <q-list class="dashboard-menu dashboard-menu--navigation" aria-label="More navigation">
            <q-item
              v-for="item in moreItems"
              :key="item.path"
              class="dashboard-menu__item"
              v-close-popup
              clickable
              :to="item.path"
              :active="route.path === item.path"
            >
              <q-item-section avatar><q-icon :name="item.icon" size="21px" /></q-item-section>
              <q-item-section>{{ item.label }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </button>
    </nav>

    <div class="dashboard-header__actions">
      <q-btn flat round dense icon="search" aria-label="Search" @click="searchOpen = true">
        <q-tooltip>Search dashboard</q-tooltip>
      </q-btn>
      <q-btn flat round dense icon="notifications_none" aria-label="Notifications">
        <q-badge
          v-if="unreadCount"
          floating
          rounded
          class="dashboard-header__notification"
          :label="unreadCount"
        />
        <q-tooltip>Notifications</q-tooltip>
        <q-menu anchor="bottom right" self="top right" :offset="[0, 8]">
          <div class="notif" aria-label="Recent notifications">
            <header class="notif__head">
              <strong>Notifications</strong>
              <button v-if="unreadCount" type="button" class="notif__markall" @click="markAllRead">
                Mark all read
              </button>
            </header>
            <button
              v-for="notification in notifications"
              :key="notification.title"
              type="button"
              class="notif__item"
              :class="{ 'notif__item--read': notification.read }"
              @click="notification.read = true"
            >
              <span class="notif__icon" :class="`notif__icon--${notification.tone}`">
                <q-icon :name="notification.icon" />
              </span>
              <span class="notif__text">
                <strong>{{ notification.title }}</strong>
                <small>{{ notification.detail }}</small>
              </span>
              <span v-if="!notification.read" class="notif__dot" aria-label="Unread" />
            </button>
            <p v-if="!unreadCount" class="notif__done">
              <q-icon name="task_alt" /> You're all caught up
            </p>
          </div>
        </q-menu>
      </q-btn>
      <q-btn
        flat
        round
        dense
        :icon="ui.theme === 'dark' ? 'light_mode' : 'dark_mode'"
        :aria-label="`Switch to ${ui.theme === 'dark' ? 'light' : 'dark'} mode`"
        @click="ui.toggleTheme"
      >
        <q-tooltip>Switch to {{ ui.theme === 'dark' ? 'light' : 'dark' }} mode</q-tooltip>
      </q-btn>
      <q-btn flat round class="dashboard-header__avatar" aria-label="Open profile menu">
        <img v-if="auth.avatarUrl" :src="auth.avatarUrl" alt="" />
        <span v-else>{{ initials }}</span>
        <q-tooltip>Profile</q-tooltip>
        <q-menu anchor="bottom right" self="top right" :offset="[0, 8]">
          <q-list class="dashboard-menu dashboard-menu--profile">
            <q-item>
              <q-item-section>
                <q-item-label>{{ auth.profile?.display_name ?? 'Personal profile' }}</q-item-label>
                <q-item-label caption>{{ auth.user?.email }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable to="/settings" v-close-popup>
              <q-item-section avatar><q-icon name="person_outline" /></q-item-section>
              <q-item-section>Profile settings</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>

    <q-dialog v-model="searchOpen">
      <q-card class="dashboard-search-dialog">
        <q-card-section class="dashboard-search-dialog__header">
          <q-input v-model="search" autofocus outlined clearable label="Search pages and actions">
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </q-card-section>
        <q-list padding>
          <q-item
            v-for="item in searchResults"
            :key="item.path"
            clickable
            :to="item.path"
            v-close-popup
          >
            <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
            <q-item-section side><q-icon name="arrow_forward" /></q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-dialog>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useUiStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { useSlidingRouteIndicator } from '@/composables/useSlidingRouteIndicator';

const route = useRoute();
const ui = useUiStore();
const auth = useAuthStore();
const { container, indicator } = useSlidingRouteIndicator();
const moreOpen = ref(false);
const searchOpen = ref(false);
const search = ref('');
// Keep the primary bar compact; everything else lives in the More menu.
const navigation = [
  { label: 'Dashboard', path: '/', icon: 'dashboard' },
  { label: 'Tasks', path: '/tasks', icon: 'task_alt' },
  { label: 'Calendar', path: '/calendar', icon: 'calendar_month' },
  { label: 'Projects', path: '/projects', icon: 'work_outline' },
];
const moreItems = [
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
const notifications = ref([
  {
    title: 'Weekly review at 16:00',
    detail: 'Today · Planning',
    icon: 'event',
    tone: 'mint',
    read: false,
  },
  {
    title: 'Dashboard milestone due soon',
    detail: 'Friday · Projects',
    icon: 'flag',
    tone: 'teal',
    read: false,
  },
]);
const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length);
function markAllRead() {
  notifications.value.forEach((n) => (n.read = true));
}
const searchResults = computed(() => {
  const all = [...navigation, ...moreItems];
  const query = search.value.trim().toLocaleLowerCase();
  return query ? all.filter((item) => item.label.toLocaleLowerCase().includes(query)) : all;
});
const initials = computed(() =>
  (auth.profile?.display_name ?? auth.user?.email ?? 'You')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase())
    .join(''),
);
</script>

<style scoped lang="scss">
.dashboard-header {
  position: sticky;
  z-index: 20;
  top: 0;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-4);
  min-height: 56px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid color-mix(in srgb, var(--color-text) 18%, transparent);
  border-radius: 18px;
  background: var(--color-nav-bg);
  box-shadow: var(--shadow-sm);
}

.dashboard-header__brand,
.dashboard-header__nav,
.dashboard-header__actions {
  display: flex;
  align-items: center;
}

.dashboard-header__brand {
  gap: var(--space-2);
  color: var(--color-text);
  text-decoration: none;
}

.dashboard-header__brand-mark,
.dashboard-header__avatar {
  display: grid;
  place-items: center;
  color: var(--color-button-primary-text);
  background: var(--color-button-primary-bg);
}

.dashboard-header__avatar img {
  /* Fill the round button and clip to a circle (the content span it sits in
     has no radius, so `inherit` resolved to 0 and photos rendered square). */
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.dashboard-header__brand-mark {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.dashboard-header__brand-text {
  font-family: var(--font-heading);
  font-size: 0.9rem;
  font-weight: 600;
}

.dashboard-header__nav {
  justify-content: center;
  gap: var(--space-1);
}

.dashboard-header__nav-link {
  min-height: 36px;
  padding: 0.45rem 0.8rem;
  border-radius: var(--radius-pill);
  color: var(--color-text-secondary);
  font-size: 0.84rem;
  font-weight: 500;
  text-decoration: none;
  transition:
    color var(--duration-fast) var(--ease-smooth-out),
    background-color var(--duration-fast) var(--ease-smooth-out);
}

.dashboard-header__nav-link:hover {
  color: var(--color-text);
  background: var(--color-nav-hover);
}

.dashboard-header__nav-link--active,
.dashboard-header__nav-link--active:hover {
  color: var(--color-nav-active-text);
  background: transparent;
}

.dashboard-header__nav-more {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  cursor: pointer;
}

.dashboard-header__nav-more > .q-icon {
  transition: transform var(--duration-quick) var(--ease-smooth-out);
}

.dashboard-header__nav-more--open > .q-icon {
  transform: rotate(180deg);
}

.dashboard-header__actions {
  gap: var(--space-1);
  color: var(--color-text-secondary);
}

.dashboard-header__actions :deep(.q-btn) {
  width: 38px;
  height: 38px;
  min-width: 38px;
}

.dashboard-header__actions .q-btn:hover {
  color: var(--color-text);
  background: var(--color-surface-soft);
}

.dashboard-header__notification {
  color: var(--color-on-primary);
  background: var(--color-primary) !important;
  font-size: 0.62rem;
}

/* ---- notifications panel ---- */
.notif {
  width: min(340px, 92vw);
  padding: var(--space-2);
  color: var(--color-text);
  background: var(--color-surface);
}
.notif__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2) var(--space-2);
}
.notif__head strong {
  font-family: var(--font-heading);
  font-size: 1rem;
}
.notif__markall {
  min-height: 32px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-pill);
  color: var(--color-primary);
  font-family: var(--font-control);
  font-size: 0.72rem;
}
.notif__markall:hover {
  background: var(--color-surface-soft);
}
.notif__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  color: inherit;
  text-align: left;
}
.notif__item:hover {
  background: var(--color-surface-soft);
}
.notif__item--read {
  opacity: 0.55;
}
.notif__icon {
  display: grid;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 12px;
  font-size: 1.1rem;
}
.notif__icon--mint {
  color: var(--brand-deep);
  background: var(--brand-mint);
}
.notif__icon--teal {
  color: var(--color-on-secondary);
  background: var(--color-secondary);
}
.notif__text {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 1px;
}
.notif__text strong {
  overflow: hidden;
  font-family: var(--font-control);
  font-size: 0.84rem;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.notif__text small {
  font-family: var(--font-body);
  font-size: 0.72rem;
  font-style: italic;
  color: var(--color-text-muted);
}
.notif__dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--color-primary);
}
.notif__done {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: var(--space-2);
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.74rem;
}

.dashboard-header__avatar {
  margin-left: var(--space-1);
  color: var(--color-button-secondary-text);
  background: var(--color-button-secondary-bg);
  font-size: 0.78rem;
}

.dashboard-search-dialog {
  width: min(560px, calc(100vw - 32px));
  max-height: min(620px, calc(100dvh - 48px));
  color: var(--color-text);
  background: var(--color-surface);
  border: var(--border-thin);
  border-radius: var(--radius-lg);
}

.dashboard-search-dialog__header {
  padding-bottom: 0;
}

@media (max-width: 1100px) {
  .dashboard-header {
    gap: var(--space-3);
  }

  .dashboard-header__brand-text {
    display: none;
  }

  .dashboard-header__nav-link {
    padding-inline: 0.65rem;
  }
}

@media (max-width: 800px) {
  .dashboard-header {
    grid-template-columns: 1fr auto;
    min-height: 60px;
    padding: var(--space-2);
  }

  .dashboard-header__nav,
  .dashboard-header__actions > :nth-child(2),
  .dashboard-header__actions > :nth-child(4) {
    display: none;
  }

  .dashboard-header__brand-text {
    display: inline;
  }
}

@media (max-width: 420px) {
  .dashboard-header__brand-text {
    display: none;
  }
}
</style>

<style lang="scss">
.dashboard-menu {
  color: var(--color-text);
  background: var(--color-surface);
  font-family: var(--font-control);
}

.dashboard-menu--navigation {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-1);
  width: min(400px, calc(100vw - 32px));
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.dashboard-menu__item {
  min-height: 52px;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 0.86rem;
  transition:
    color var(--duration-quick) var(--ease-smooth-out),
    background-color var(--duration-quick) var(--ease-smooth-out);
}

.dashboard-menu__item:hover {
  color: var(--color-text);
  background: var(--color-surface-soft);
}

.dashboard-menu__item.q-item--active {
  color: var(--color-button-primary-text);
  background: var(--color-button-primary-bg);
}

.dashboard-menu__item .q-item__section--avatar {
  min-width: 34px;
  padding-right: var(--space-2);
}

.dashboard-menu--profile {
  min-width: 220px;
}

@media (max-width: 460px) {
  .dashboard-menu--navigation {
    grid-template-columns: 1fr;
  }
}
</style>
