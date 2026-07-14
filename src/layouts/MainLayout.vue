<template>
  <q-layout view="hHh Lpr fFf">
    <q-page-container>
      <q-page>
        <DashboardShell>
          <router-view />
        </DashboardShell>
        <CommandPalette />
        <QuickAddSheet />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import DashboardShell from '@/components/layout/DashboardShell.vue';
import CommandPalette from '@/components/command/CommandPalette.vue';
import QuickAddSheet from '@/components/command/QuickAddSheet.vue';
</script>
