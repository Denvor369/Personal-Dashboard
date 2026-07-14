import type { TableRow } from '@/types/database.types';

export type Profile = TableRow<'profiles'>;
export type ProfileTheme = 'system' | 'light' | 'dark';

export interface ProfileDraft {
  displayName: string;
  username: string;
  bio: string;
  timezone: string;
  theme: ProfileTheme;
  profileCompleted?: boolean;
}
