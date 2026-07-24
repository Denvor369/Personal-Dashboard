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

export interface GitHubRepo {
  fullName: string;
  url: string;
  private: boolean;
  language: string | null;
  stars: number;
  openIssues: number;
  pushedAt: string;
}

export interface GitHubOverview {
  login: string;
  publicRepos: number;
  privateRepos: number;
  followers: number;
  repos: GitHubRepo[];
}

export async function fetchGitHubOverview(): Promise<GitHubOverview> {
  const token = await getProviderToken('github');
  if (!token) throw new Error('GitHub is not connected.');
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };
  const [userRes, reposRes] = await Promise.all([
    fetch('https://api.github.com/user', { headers }),
    fetch('https://api.github.com/user/repos?sort=pushed&per_page=10', { headers }),
  ]);
  if (!userRes.ok || !reposRes.ok)
    throw new Error(`GitHub error (${!userRes.ok ? userRes.status : reposRes.status}). Try reconnecting.`);
  const user = (await userRes.json()) as {
    login: string;
    public_repos?: number;
    total_private_repos?: number;
    followers?: number;
  };
  const repos = (await reposRes.json()) as Array<{
    full_name: string;
    html_url: string;
    private: boolean;
    language: string | null;
    stargazers_count: number;
    open_issues_count: number;
    pushed_at: string;
  }>;
  return {
    login: user.login,
    publicRepos: user.public_repos ?? 0,
    privateRepos: user.total_private_repos ?? 0,
    followers: user.followers ?? 0,
    repos: repos.map((repo) => ({
      fullName: repo.full_name,
      url: repo.html_url,
      private: repo.private,
      language: repo.language,
      stars: repo.stargazers_count,
      openIssues: repo.open_issues_count,
      pushedAt: repo.pushed_at,
    })),
  };
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
