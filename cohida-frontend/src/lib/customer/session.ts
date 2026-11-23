import { apiBaseUrl } from './config';

const savedAccountsKey = 'cohida-saved-accounts';
const currentSessionKey = 'cohida-current-session';
const legacyTokenKey = 'cohida-access-token';
const lastSessionKey = 'cohida-last-session';
localStorage.removeItem(legacyTokenKey);

export class SessionExpiredError extends Error {}

export type SessionRole = 'ADMIN' | 'CUSTOMER';
export interface SavedAccount {
  name: string;
  role: SessionRole;
  sessionId: string;
  accountId?: string;
}
export interface SessionAuthentication {
  accessToken: string;
  customerName?: string;
  role: string;
  sessionId: string;
}

let accessToken: string | null = null;
let tokenSession: string | null = null;
const pendingRefreshes = new Map<string, Promise<SessionAuthentication>>();

function parseSession(
  token: string,
): { role: SessionRole; exp: number; accountId: string } | null {
  const encoded = token.split('.')[1];
  if (!encoded) return null;
  try {
    const payload = JSON.parse(
      atob(
        encoded
          .replace(/-/g, '+')
          .replace(/_/g, '/')
          .padEnd(Math.ceil(encoded.length / 4) * 4, '='),
      ),
    ) as { exp?: number; role?: string; sub?: unknown };
    if (typeof payload.exp !== 'number' || typeof payload.sub !== 'string')
      return null;
    return payload.role === 'ADMIN' || payload.role === 'CUSTOMER'
      ? { role: payload.role, exp: payload.exp, accountId: payload.sub }
      : null;
  } catch {
    return null;
  }
}

export function getSavedAccounts(): SavedAccount[] {
  try {
    const stored = JSON.parse(localStorage.getItem(savedAccountsKey) ?? '[]');
    if (!Array.isArray(stored)) return [];
    const accounts = stored
      .filter(
        (account): account is SavedAccount =>
          typeof account === 'object' &&
          account !== null &&
          typeof account.name === 'string' &&
          typeof account.sessionId === 'string' &&
          /^[0-9a-f-]{36}$/.test(account.sessionId) &&
          (account.role === 'ADMIN' || account.role === 'CUSTOMER'),
      )
      .map(({ name, role, sessionId, accountId }) => ({
        name,
        role,
        sessionId,
        ...(accountId ? { accountId } : {}),
      }));
    // Old saved accounts contained bearer credentials. Remove them on upgrade.
    if (JSON.stringify(accounts) !== JSON.stringify(stored)) {
      localStorage.setItem(savedAccountsKey, JSON.stringify(accounts));
    }
    return accounts;
  } catch {
    return [];
  }
}

export function getCurrentSessionId(): string | null {
  const id =
    sessionStorage.getItem(currentSessionKey) ??
    localStorage.getItem(lastSessionKey);
  if (!id || !getSavedAccounts().some((account) => account.sessionId === id)) {
    return null;
  }
  if (!sessionStorage.getItem(currentSessionKey)) {
    sessionStorage.setItem(currentSessionKey, id);
  }
  return id;
}

export function saveAccount(authentication: SessionAuthentication) {
  const parsed = parseSession(authentication.accessToken);
  if (
    !parsed ||
    parsed.role !== authentication.role ||
    !/^[0-9a-f-]{36}$/.test(authentication.sessionId)
  ) {
    throw new Error('Não foi possível iniciar a sessão.');
  }
  const previous = getSavedAccounts().find(
    (account) => account.sessionId === authentication.sessionId,
  );
  const account: SavedAccount = {
    name:
      authentication.customerName?.trim() ||
      previous?.name ||
      (parsed.role === 'ADMIN' ? 'Administradora' : 'Minha conta'),
    role: parsed.role,
    accountId: parsed.accountId,
    sessionId: authentication.sessionId,
  };
  const existing = getSavedAccounts();
  existing
    .filter(
      (saved) =>
        saved.sessionId !== account.sessionId &&
        saved.accountId === account.accountId,
    )
    .forEach((saved) => revoke(saved.sessionId));
  localStorage.setItem(
    savedAccountsKey,
    JSON.stringify([
      account,
      ...existing.filter(
        (saved) =>
          saved.sessionId !== account.sessionId &&
          saved.accountId !== account.accountId,
      ),
    ]),
  );
  localStorage.removeItem(legacyTokenKey);
  sessionStorage.setItem(currentSessionKey, account.sessionId);
  localStorage.setItem(lastSessionKey, account.sessionId);
  accessToken = authentication.accessToken;
  tokenSession = account.sessionId;
  if (account.role === 'ADMIN')
    localStorage.setItem('cohida-admin-name', account.name);
  else localStorage.removeItem('cohida-admin-name');
}

async function requestRefresh(id: string): Promise<SessionAuthentication> {
  const request = async () => {
    const response = await fetch(`${apiBaseUrl}/auth/sessions/${id}/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Cohida-Session': '1' },
    });
    if (response.status === 401 || response.status === 403) {
      throw new SessionExpiredError('Sua sessão expirou. Entre novamente.');
    }
    if (!response.ok) throw new Error('Não foi possível renovar a sessão.');
    return (await response.json()) as SessionAuthentication;
  };
  // Serialize rotations between tabs when supported by the browser.
  return navigator.locks
    ? navigator.locks.request(`cohida-refresh-${id}`, request)
    : request();
}

function refresh(id: string): Promise<SessionAuthentication> {
  const current = pendingRefreshes.get(id);
  if (current) return current;
  const request = requestRefresh(id).finally(() => pendingRefreshes.delete(id));
  pendingRefreshes.set(id, request);
  return request;
}

export async function ensureAccessToken(force = false): Promise<string | null> {
  const id = getCurrentSessionId();
  if (!id) return null;
  const parsed =
    accessToken && tokenSession === id ? parseSession(accessToken) : null;
  if (!force && parsed && parsed.exp * 1000 > Date.now() + 30_000)
    return accessToken;
  const authentication = await refresh(id);
  if (authentication.sessionId !== id || getCurrentSessionId() !== id)
    throw new Error('A conta mudou durante a operação.');
  saveAccount(authentication);
  return authentication.accessToken;
}

export async function switchAccount(account: SavedAccount) {
  if (getCurrentSessionId() === account.sessionId) return;
  const current = getCurrentSessionId();
  const authentication = await refresh(account.sessionId);
  if (
    getCurrentSessionId() !== current ||
    authentication.sessionId !== account.sessionId
  ) {
    throw new Error('A conta mudou durante a operação.');
  }
  saveAccount(authentication);
}

export function updateCurrentAccountName(name: string) {
  const id = getCurrentSessionId();
  if (!id) return;
  localStorage.setItem(
    savedAccountsKey,
    JSON.stringify(
      getSavedAccounts().map((account) =>
        account.sessionId === id ? { ...account, name } : account,
      ),
    ),
  );
}

export function getSessionRole(): SessionRole | null {
  const id = getCurrentSessionId();
  return (
    getSavedAccounts().find((account) => account.sessionId === id)?.role ?? null
  );
}

export function hasAdminSession() {
  return getSessionRole() === 'ADMIN';
}

function revoke(id: string) {
  const request = () =>
    fetch(`${apiBaseUrl}/auth/sessions/${id}/logout`, {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
      headers: { 'X-Cohida-Session': '1' },
    });
  void (
    navigator.locks
      ? navigator.locks.request(`cohida-refresh-${id}`, request)
      : request()
  ).catch(() => undefined);
}

export function logout() {
  const id = getCurrentSessionId();
  if (id) {
    revoke(id);
    localStorage.setItem(
      savedAccountsKey,
      JSON.stringify(
        getSavedAccounts().filter((account) => account.sessionId !== id),
      ),
    );
  }
  accessToken = null;
  tokenSession = null;
  sessionStorage.removeItem(currentSessionKey);
  if (localStorage.getItem(lastSessionKey) === id) {
    localStorage.removeItem(lastSessionKey);
  }
  localStorage.removeItem(legacyTokenKey);
  localStorage.removeItem('cohida-admin-name');
}
