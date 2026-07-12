<template>
  <q-header bordered :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-white text-dark'">
    <q-toolbar>
      <q-btn
        v-if="$q.screen.gt.xs"
        flat
        round
        dense
        icon="menu"
        aria-label="Toggle sidebar"
        @click="ui.toggleSidebar"
      />

      <q-toolbar-title class="text-subtitle1 text-weight-medium">
        {{ pageTitle }}
      </q-toolbar-title>

      <q-btn
        flat
        round
        dense
        :icon="ui.theme === 'dark' ? 'light_mode' : 'dark_mode'"
        :aria-label="`Switch to ${ui.theme === 'dark' ? 'light' : 'dark'} mode`"
        @click="ui.toggleTheme"
      />
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUiStore } from '@/stores/ui.store';

const route = useRoute();
const ui = useUiStore();
const pageTitle = computed(() =>
  typeof route.meta.title === 'string' ? route.meta.title : 'Personal Dashboard',
);
</script>
