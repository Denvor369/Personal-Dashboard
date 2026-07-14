import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '@/boot/supabase';
import type { LoginCredentials, RegistrationCredentials } from '@/types/auth';

function redirectTo(path: string) {
  return `${window.location.origin}/#${path}`;
}

export function authErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.toLocaleLowerCase() : '';
  if (message.includes('invalid login credentials')) return 'The email or password is incorrect.';
  if (message.includes('email not confirmed')) return 'Verify your email before signing in.';
  if (message.includes('already registered') || message.includes('already exists'))
    return 'An account with this email is already registered.';
  if (message.includes('password'))
    return 'Use at least 8 characters with a mix of letters and numbers.';
  if (message.includes('rate') || message.includes('too many'))
    return 'Too many attempts. Please wait a moment and try again.';
  return 'We could not complete that request. Please try again.';
}

export async function getAuthSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function subscribeToAuth(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  return supabase.auth.onAuthStateChange(callback).data.subscription;
}

export async function registerAccount(credentials: RegistrationCredentials) {
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email.trim(),
    password: credentials.password,
    options: {
      data: { display_name: credentials.displayName.trim() },
      emailRedirectTo: redirectTo('/auth/verify'),
    },
  });
  if (error) throw error;
  return data;
}

export async function loginAccount(credentials: LoginCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email.trim(),
    password: credentials.password,
  });
  if (error) throw error;
  return data;
}

export async function logoutAccount() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: redirectTo('/auth/reset-password'),
  });
  if (error) throw error;
}

export async function changePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
