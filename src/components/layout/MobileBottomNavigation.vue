<template>
  <q-footer
    v-if="$q.screen.lt.sm && ui.mobileNavigationVisible"
    bordered
    :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-white text-dark'"
  >
    <q-tabs dense no-caps active-color="primary" indicator-color="transparent">
      <q-route-tab
        v-for="item in navigationItems"
        :key="item.path"
        :to="item.path"
        :icon="item.icon"
        :label="item.label"
        exact
      />
    </q-tabs>
  </q-footer>
</template>

<script setup lang="ts">
import { navigationItems } from '@/router/navigation';
import { useUiStore } from '@/stores/ui.store';

const ui = useUiStore();
</script>
