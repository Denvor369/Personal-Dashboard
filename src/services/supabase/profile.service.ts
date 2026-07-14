import { supabase } from '@/boot/supabase';
import type { Profile, ProfileDraft } from '@/types/profile';
import type { TableUpdate } from '@/types/database.types';

const avatarBucket = 'avatars';
const allowedAvatarTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxAvatarBytes = 2 * 1024 * 1024;

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Authentication required');
  return data.user.id;
}

export function profileErrorMessage(error: unknown): string {
  if (
    error instanceof Error &&
    /^(Display name|Username|Bio|Choose a valid timezone|Choose a JPEG|Profile images)/.test(
      error.message,
    )
  )
    return error.message;
  const code =
    typeof error === 'object' && error && 'code' in error ? String(error.code) : undefined;
  if (code === '23505') return 'That username is already taken.';
  return 'Your profile could not be saved. Please try again.';
}

export function validateProfile(draft: ProfileDraft): string | null {
  const displayName = draft.displayName.trim();
  const username = draft.username.trim().toLocaleLowerCase();
  if (displayName.length < 1 || displayName.length > 80)
    return 'Display name must be between 1 and 80 characters.';
  if (username && !/^[a-z0-9_]{3,30}$/.test(username))
    return 'Username must be 3–30 lowercase letters, numbers, or underscores.';
  if (draft.bio.trim().length > 280) return 'Bio must be 280 characters or fewer.';
  try {
    new Intl.DateTimeFormat('en', { timeZone: draft.timezone }).format();
  } catch {
    return 'Choose a valid timezone.';
  }
  return null;
}

export async function getProfile(): Promise<Profile | null> {
  const id = await currentUserId();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveProfile(draft: ProfileDraft): Promise<Profile> {
  const id = await currentUserId();
  const validationError = validateProfile(draft);
  if (validationError) throw new Error(validationError);
  const changes: TableUpdate<'profiles'> = {
    bio: draft.bio.trim() || null,
    display_name: draft.displayName.trim(),
    ...(draft.profileCompleted === undefined ? {} : { profile_completed: draft.profileCompleted }),
    theme: draft.theme,
    timezone: draft.timezone,
    username: draft.username.trim().toLocaleLowerCase() || null,
  };
  const { data, error } = await supabase
    .from('profiles')
    .update(changes)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function avatarSignedUrl(path: string | null) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(avatarBucket).createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

async function compressAvatar(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.82),
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], 'avatar.webp', { type: 'image/webp' });
  } catch {
    return file;
  }
}

export async function uploadProfileAvatar(
  file: File,
  previousPath: string | null,
  onProgress: (value: number) => void,
) {
  if (!allowedAvatarTypes.has(file.type)) throw new Error('Choose a JPEG, PNG, or WebP image.');
  if (file.size > maxAvatarBytes) throw new Error('Profile images must be 2 MB or smaller.');

  const id = await currentUserId();
  onProgress(0.2);
  const prepared = await compressAvatar(file);
  const extension =
    prepared.type === 'image/webp' ? 'webp' : prepared.type === 'image/png' ? 'png' : 'jpg';
  const path = `${id}/${crypto.randomUUID()}.${extension}`;
  onProgress(0.45);

  const { error: uploadError } = await supabase.storage
    .from(avatarBucket)
    .upload(path, prepared, { cacheControl: '3600', contentType: prepared.type, upsert: false });
  if (uploadError) throw uploadError;
  onProgress(0.85);

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: path })
    .eq('id', id);
  if (profileError) {
    await supabase.storage.from(avatarBucket).remove([path]);
    throw profileError;
  }
  if (previousPath?.startsWith(`${id}/`))
    await supabase.storage.from(avatarBucket).remove([previousPath]);
  onProgress(1);
  return path;
}

export async function removeProfileAvatar(path: string | null) {
  if (!path) return;
  const id = await currentUserId();
  if (!path.startsWith(`${id}/`)) throw new Error('Invalid avatar path');
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', id);
  if (profileError) throw profileError;
  const { error } = await supabase.storage.from(avatarBucket).remove([path]);
  if (error) throw error;
}
