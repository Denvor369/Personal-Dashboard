export type BrandThemeId = 'botanical' | 'midnight-blue' | 'graphite' | 'cloud-blue';
export type AppearancePreference = 'light' | 'dark' | 'system';
export type ResolvedAppearance = Exclude<AppearancePreference, 'system'>;
export type ThemeTokens = Record<`--${string}`, string>;

export interface ThemeDefinition {
  id: BrandThemeId;
  name: string;
  description: string;
  preview: readonly [string, string, string, string];
  fontRoles: {
    heading: string;
    interactive: string;
    body: string;
  };
  tokens: Record<ResolvedAppearance, ThemeTokens>;
}

export interface UiThemeSettings {
  brandTheme: BrandThemeId;
  appearance: AppearancePreference;
}
