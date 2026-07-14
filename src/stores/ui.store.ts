import { ref } from 'vue';
import { defineStore } from 'pinia';
import { Dark } from 'quasar';
import { applyTheme, resolveAppearance, themeRegistry } from '@/themes/theme.registry';
import type {
  AppearancePreference,
  BrandThemeId,
  ResolvedAppearance,
  UiThemeSettings,
} from '@/themes/theme.types';

export type Theme = ResolvedAppearance;
export type ThemePreference = AppearancePreference;

const settingsKey = 'personal-dashboard-ui-theme';
const legacyThemeKey = 'personal-dashboard-theme';
const defaults: UiThemeSettings = { brandTheme: 'botanical', appearance: 'system' };

function readSettings(): UiThemeSettings {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(settingsKey) ?? 'null',
    ) as Partial<UiThemeSettings>;
    const legacyAppearance = localStorage.getItem(legacyThemeKey);
    return {
      brandTheme:
        parsed?.brandTheme && parsed.brandTheme in themeRegistry
          ? parsed.brandTheme
          : defaults.brandTheme,
      appearance:
        parsed?.appearance === 'light' ||
        parsed?.appearance === 'dark' ||
        parsed?.appearance === 'system'
          ? parsed.appearance
          : legacyAppearance === 'light' ||
              legacyAppearance === 'dark' ||
              legacyAppearance === 'system'
            ? legacyAppearance
            : defaults.appearance,
    };
  } catch {
    return defaults;
  }
}

export const useUiStore = defineStore('ui', () => {
  const initial = readSettings();
  const brandTheme = ref<BrandThemeId>(initial.brandTheme);
  const appearance = ref<AppearancePreference>(initial.appearance);
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const theme = ref<Theme>(resolveAppearance(appearance.value, systemDark.matches));

  function sync(persist = true) {
    theme.value = resolveAppearance(appearance.value, systemDark.matches);
    Dark.set(theme.value === 'dark');
    applyTheme(brandTheme.value, theme.value);
    if (persist)
      localStorage.setItem(
        settingsKey,
        JSON.stringify({ brandTheme: brandTheme.value, appearance: appearance.value }),
      );
  }

  function setBrandTheme(nextTheme: BrandThemeId) {
    brandTheme.value = nextTheme;
    sync();
  }

  function setAppearance(nextAppearance: AppearancePreference) {
    appearance.value = nextAppearance;
    sync();
  }

  function toggleTheme() {
    setAppearance(theme.value === 'dark' ? 'light' : 'dark');
  }

  systemDark.addEventListener('change', () => {
    if (appearance.value === 'system') sync(false);
  });

  sync(false);

  return {
    brandTheme,
    appearance,
    theme,
    preference: appearance,
    setBrandTheme,
    setAppearance,
    setTheme: setAppearance,
    toggleTheme,
  };
});
