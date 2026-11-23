export const tokenKey = 'cohida-access-token';
const savedAccountsKey = 'cohida-saved-accounts';

export type SessionRole = 'ADMIN' | 'CUSTOMER';

export interface SavedAccount {
  name: string;
  role: SessionRole;
  token: string;
}

function parseSession(
  token: string,
): { role: SessionRole; subject?: string } | null {
  const encodedPayload = token.split('.')[1];
  if (!encodedPayload) return null;

  try {
    const payload = JSON.parse(
      atob(
        encodedPayload
          .replace(/-/g, '+')
          .replace(/_/g, '/')
          .padEnd(Math.ceil(encodedPayload.length / 4) * 4, '='),
      ),
    ) as { exp?: number; role?: string; sub?: unknown };

    if (payload.exp && payload.exp * 1000 <= Date.now()) return null;
    return payload.role === 'ADMIN' || payload.role === 'CUSTOMER'
      ? {
          role: payload.role,
          subject:
            typeof payload.sub === 'string' && payload.sub
              ? payload.sub
              : undefined,
        }
      : null;
  } catch {
    return null;
  }
}

function parseSessionRole(token: string): SessionRole | null {
  return parseSession(token)?.role ?? null;
}

function accountKey(token: string): string {
  const subject = parseSession(token)?.subject;
  return subject ? `subject:${subject}` : `token:${token}`;
}

function readSavedAccounts(): SavedAccount[] {
  try {
    const stored = JSON.parse(
      localStorage.getItem(savedAccountsKey) ?? '[]',
    ) as unknown;
    if (!Array.isArray(stored)) return [];

    const accounts = stored.filter(
      (account): account is SavedAccount =>
        typeof account === 'object' &&
        account !== null &&
        typeof account.name === 'string' &&
        typeof account.token === 'string' &&
        (account.role === 'ADMIN' || account.role === 'CUSTOMER') &&
        parseSessionRole(account.token) === account.role,
    );
    const currentToken = localStorage.getItem(tokenKey);
    const uniqueAccounts = new Map<string, SavedAccount>();
    for (const account of accounts) {
      const key = accountKey(account.token);
      if (!uniqueAccounts.has(key) || account.token === currentToken) {
        uniqueAccounts.set(key, account);
      }
    }
    return [...uniqueAccounts.values()];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: SavedAccount[]) {
  localStorage.setItem(savedAccountsKey, JSON.stringify(accounts));
}

export function saveAccount(token: string, role: string, name?: string) {
  const sessionRole = parseSessionRole(token);
  if (!sessionRole || sessionRole !== role) return;

  const account: SavedAccount = {
    name:
      name?.trim() ||
      (sessionRole === 'ADMIN' ? 'Administradora' : 'Minha conta'),
    role: sessionRole,
    token,
  };
  saveAccounts([
    account,
    ...readSavedAccounts().filter(
      (saved) => accountKey(saved.token) !== accountKey(token),
    ),
  ]);
}

export function getSavedAccounts() {
  return readSavedAccounts();
}

export function switchAccount(account: SavedAccount) {
  localStorage.setItem(tokenKey, account.token);
  if (account.role === 'ADMIN') {
    localStorage.setItem('cohida-admin-name', account.name);
  } else {
    localStorage.removeItem('cohida-admin-name');
  }
}

export function updateCurrentAccountName(name: string) {
  const token = localStorage.getItem(tokenKey);
  const role = token ? parseSessionRole(token) : null;
  if (!token || !role) return;
  saveAccount(token, role, name);
}

export function getSessionRole(): SessionRole | null {
  const token = localStorage.getItem(tokenKey);
  return token ? parseSessionRole(token) : null;
}

export function hasAdminSession() {
  return getSessionRole() === 'ADMIN';
}

export function logout() {
  const token = localStorage.getItem(tokenKey);
  if (token) {
    saveAccounts(
      readSavedAccounts().filter((account) => account.token !== token),
    );
  }
  localStorage.removeItem(tokenKey);
  localStorage.removeItem('cohida-admin-name');
}
