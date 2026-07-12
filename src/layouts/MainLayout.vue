<template>
  <q-layout view="hHh Lpr fFf">
    <AppHeader />
    <DesktopSidebar />
    <MobileBottomNavigation />

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue';
import DesktopSidebar from '@/components/layout/DesktopSidebar.vue';
import MobileBottomNavigation from '@/components/layout/MobileBottomNavigation.vue';
</script>
