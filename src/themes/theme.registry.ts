import { botanicalTheme } from './botanical.theme';
import { midnightBlueTheme } from './midnight-blue.theme';
import { graphiteTheme } from './graphite.theme';
import { cloudBlueTheme } from './cloud-blue.theme';
import type {
  AppearancePreference,
  BrandThemeId,
  ResolvedAppearance,
  ThemeDefinition,
} from './theme.types';

export const themes = [botanicalTheme, midnightBlueTheme, graphiteTheme, cloudBlueTheme] as const;
export const themeRegistry = Object.fromEntries(themes.map((theme) => [theme.id, theme])) as Record<
  BrandThemeId,
  ThemeDefinition
>;

export function resolveAppearance(
  preference: AppearancePreference,
  systemDark: boolean,
): ResolvedAppearance {
  return preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
}

export function applyTheme(themeId: BrandThemeId, appearance: ResolvedAppearance) {
  const theme = themeRegistry[themeId];
  const root = document.documentElement;

  for (const [name, value] of Object.entries(theme.tokens[appearance]))
    root.style.setProperty(name, value);

  root.style.setProperty('--font-heading', theme.fontRoles.heading);
  root.style.setProperty('--font-control', theme.fontRoles.interactive);
  root.style.setProperty('--font-body', theme.fontRoles.body);
  root.dataset.brandTheme = themeId;
  root.dataset.appearance = appearance;
  root.style.colorScheme = appearance;
}
