import type { ProfileTheme } from '@/types/profile';

export const profileThemes: Array<{ label: string; value: ProfileTheme }> = [
  { label: 'Follow device', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

export const timezones =
  typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('timeZone')
    : ['Asia/Phnom_Penh', 'UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
