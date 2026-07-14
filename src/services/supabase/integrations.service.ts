import { supabase } from '@/boot/supabase';

// Real integration connections. GitHub first: the user pastes a fine-grained
// read-only personal access token; we validate it against the GitHub API, then
// store it in connected_accounts (RLS: owner-only rows).

export interface ConnectedAccount {
  provider: string;
  accountLabel: string;
  connectedAt: string;
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Authentication required');
  return data.user.id;
}

export async function getConnectedAccounts(): Promise<ConnectedAccount[]> {
  const { data, error } = await supabase
    .from('connected_accounts')
    .select('provider, account_label, created_at');
  if (error) {
    // Table not migrated yet — treat as "nothing connected" instead of breaking the page.
    if (error.code === '42P01') return [];
    throw error;
  }
  return (data ?? []).map((row) => ({
    provider: row.provider,
    accountLabel: row.account_label,
    connectedAt: row.created_at,
  }));
}

export async function connectGitHub(token: string): Promise<string> {
  const trimmed = token.trim();
  if (!trimmed) throw new Error('Paste a GitHub personal access token.');

  // Validate the token against GitHub before storing anything.
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${trimmed}`,
      Accept: 'application/vnd.github+json',
    },
  });
  if (response.status === 401) throw new Error('GitHub rejected this token. Check it and try again.');
  if (!response.ok) throw new Error(`GitHub error (${response.status}). Try again later.`);
  const account = (await response.json()) as { login: string };

  const userId = await currentUserId();
  const { error } = await supabase.from('connected_accounts').upsert(
    {
      user_id: userId,
      provider: 'github',
      account_label: account.login,
      access_token: trimmed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,provider' },
  );
  if (error) {
    if (error.code === '42P01')
      throw new Error('Run the connected_accounts migration in Supabase first.');
    throw error;
  }
  return account.login;
}

export async function disconnectProvider(provider: string): Promise<void> {
  const { error } = await supabase.from('connected_accounts').delete().eq('provider', provider);
  if (error && error.code !== '42P01') throw error;
}

export async function getProviderToken(provider: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('connected_accounts')
    .select('access_token')
    .eq('provider', provider)
    .maybeSingle();
  if (error) {
    if (error.code === '42P01') return null;
    throw error;
  }
  return data?.access_token ?? null;
}
