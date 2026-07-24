<template>
  <div class="dashboard-page">
    <div class="dashboard-shell">
      <a class="dashboard-skip-link" href="#dashboard-main">Skip to page content</a>
      <DashboardTopNavigation />
      <div id="dashboard-main" class="dashboard-shell__content" tabindex="-1"><slot /></div>
    </div>
    <DashboardMobileNavigation />
  </div>
</template>

<script setup lang="ts">
import DashboardMobileNavigation from '@/components/layout/DashboardMobileNavigation.vue';
import DashboardTopNavigation from '@/components/layout/DashboardTopNavigation.vue';
</script>

<style scoped lang="scss">
.dashboard-page {
  min-height: 100dvh;
  padding: clamp(0.75rem, 1.8vw, 1.75rem);
  background: var(--color-background);
}

.dashboard-shell {
  display: flex;
  flex-direction: column;
  gap: clamp(0.5rem, 1.1vw, 0.85rem);
  width: min(100%, 1680px);
  height: calc(100dvh - clamp(1.5rem, 3.6vw, 3.5rem));
  margin: 0 auto;
  overflow: hidden;
  background: transparent;
}

.dashboard-shell__content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  // Home fits exactly; other routes scroll inside the shell (nav stays put).
  overflow-x: hidden;
  overflow-y: auto;
}

.dashboard-skip-link {
  position: fixed;
  z-index: 2000;
  top: var(--space-2);
  left: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-pill);
  color: var(--color-on-primary);
  background: var(--color-primary);
  text-decoration: none;
  transform: translateY(-160%);
  transition: transform var(--transition-fast) var(--ease);
}

.dashboard-skip-link:focus {
  transform: translateY(0);
}

@media (max-width: 800px) {
  .dashboard-page {
    padding: var(--space-2) var(--space-2) 108px;
    background: var(--color-background);
  }

  .dashboard-shell {
    height: auto;
    min-height: calc(100dvh - 116px);
    overflow: visible;
  }

  .dashboard-shell__content {
    overflow: visible;
  }
}
</style>
