<template>
  <q-drawer
    :model-value="ui.sidebarOpen"
    :mini="ui.sidebarCollapsed"
    :breakpoint="599"
    bordered
    show-if-above
    @update:model-value="ui.setSidebarOpen"
  >
    <q-list padding>
      <q-item
        v-for="item in navigationItems"
        :key="item.path"
        v-ripple
        clickable
        :to="item.path"
        exact
      >
        <q-item-section avatar>
          <q-icon :name="item.icon" />
        </q-item-section>
        <q-item-section>{{ item.label }}</q-item-section>
      </q-item>
    </q-list>

    <div class="absolute-bottom q-pa-sm">
      <q-btn
        flat
        round
        dense
        :icon="ui.sidebarCollapsed ? 'chevron_right' : 'chevron_left'"
        :aria-label="ui.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="ui.toggleSidebarCollapsed"
      />
    </div>
  </q-drawer>
</template>

<script setup lang="ts">
import { navigationItems } from '@/router/navigation';
import { useUiStore } from '@/stores/ui.store';

const ui = useUiStore();
</script>
