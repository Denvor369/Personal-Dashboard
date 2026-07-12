import { ref } from 'vue';
import { defineStore } from 'pinia';
import { Dark } from 'quasar';

export type Theme = 'light' | 'dark';

const themeKey = 'personal-dashboard-theme';

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(true);
  const sidebarCollapsed = ref(false);
  const mobileNavigationVisible = ref(true);
  const theme = ref<Theme>(localStorage.getItem(themeKey) === 'dark' ? 'dark' : 'light');

  Dark.set(theme.value === 'dark');

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value;
  }

  function setSidebarOpen(value: boolean) {
    sidebarOpen.value = value;
  }

  function toggleSidebarCollapsed() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function setMobileNavigationVisible(value: boolean) {
    mobileNavigationVisible.value = value;
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
    Dark.set(theme.value === 'dark');
    localStorage.setItem(themeKey, theme.value);
  }

  return {
    sidebarOpen,
    sidebarCollapsed,
    mobileNavigationVisible,
    theme,
    toggleSidebar,
    setSidebarOpen,
    toggleSidebarCollapsed,
    setMobileNavigationVisible,
    toggleTheme,
  };
});
