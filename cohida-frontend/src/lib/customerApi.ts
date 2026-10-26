const baseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";
const tokenKey = "cohida-access-token";
const savedAccountsKey = "cohida-saved-accounts";

export type SessionRole = "ADMIN" | "CUSTOMER";

export interface SavedAccount {
  name: string;
  role: SessionRole;
  token: string;
}

function parseSessionRole(token: string): SessionRole | null {
  const encodedPayload = token.split(".")[1];
  if (!encodedPayload) return null;

  try {
    const payload = JSON.parse(
      atob(
        encodedPayload
          .replace(/-/g, "+")
          .replace(/_/g, "/")
          .padEnd(Math.ceil(encodedPayload.length / 4) * 4, "="),
      ),
    ) as { exp?: number; role?: string };

    if (payload.exp && payload.exp * 1000 <= Date.now()) return null;
    return payload.role === "ADMIN" || payload.role === "CUSTOMER"
      ? payload.role
      : null;
  } catch {
    return null;
  }
}

function readSavedAccounts(): SavedAccount[] {
  try {
    const stored = JSON.parse(
      localStorage.getItem(savedAccountsKey) ?? "[]",
    ) as unknown;
    if (!Array.isArray(stored)) return [];

    return stored.filter(
      (account): account is SavedAccount =>
        typeof account === "object" &&
        account !== null &&
        typeof account.name === "string" &&
        typeof account.token === "string" &&
        (account.role === "ADMIN" || account.role === "CUSTOMER") &&
        parseSessionRole(account.token) === account.role,
    );
  } catch {
    return [];
  }
}

function saveAccounts(accounts: SavedAccount[]) {
  localStorage.setItem(savedAccountsKey, JSON.stringify(accounts));
}

function saveAccount(token: string, role: string, name?: string) {
  const sessionRole = parseSessionRole(token);
  if (!sessionRole || sessionRole !== role) return;

  const account: SavedAccount = {
    name:
      name?.trim() ||
      (sessionRole === "ADMIN" ? "Administradora" : "Minha conta"),
    role: sessionRole,
    token,
  };
  saveAccounts([
    account,
    ...readSavedAccounts().filter((saved) => saved.token !== token),
  ]);
}

export function getSavedAccounts() {
  return readSavedAccounts();
}

export function switchAccount(account: SavedAccount) {
  localStorage.setItem(tokenKey, account.token);
  if (account.role === "ADMIN") {
    localStorage.setItem("cohida-admin-name", account.name);
  } else {
    localStorage.removeItem("cohida-admin-name");
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
  return getSessionRole() === "ADMIN";
}

export interface CustomerAddressInput {
  label: string;
  street: string;
  number: string;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
}

export interface CustomerCreateInput {
  name: string;
  birthDate: string;
  cpf: string;
  phone: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  billingAddress: CustomerAddressInput;
  deliveryAddress: CustomerAddressInput;
}

export interface CustomerUpdateInput {
  name: string;
  birthDate: string;
  phone: string;
  email: string;
  billingAddress: CustomerAddressInput;
  deliveryAddress: CustomerAddressInput;
}

export interface CustomerResponse extends Omit<
  CustomerCreateInput,
  "password" | "passwordConfirmation"
> {
  id: number;
  code: string;
  active: boolean;
  addresses: Array<
    CustomerAddressInput & { id: number; type: "BILLING" | "DELIVERY" }
  >;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem(tokenKey);
  const headers = new Headers(options.headers);
  const isMultipartBody =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isMultipartBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    const isAuthenticationEndpoint = path.startsWith("/auth/");
    if (
      (response.status === 401 || response.status === 403) &&
      token &&
      !isAuthenticationEndpoint
    ) {
      // Do not let an in-flight request from an old session erase a newer
      // token just saved by a successful login.
      if (localStorage.getItem(tokenKey) === token) {
        logout();
        if (window.location.pathname !== "/entrar") {
          window.location.replace("/entrar");
        }
      }
      throw new Error("Sua sessão expirou. Entre novamente para continuar.");
    }
    throw new Error(body?.message ?? "Não foi possível concluir a operação.");
  }
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}

export async function login(email: string, password: string) {
  const authentication = await apiRequest<{
    accessToken: string;
    role: string;
    customerName?: string;
  }>("/auth/login", {
    body: JSON.stringify({ email, password }),
    method: "POST",
  });
  localStorage.setItem(tokenKey, authentication.accessToken);
  localStorage.removeItem("cohida-admin-name");
  saveAccount(
    authentication.accessToken,
    authentication.role,
    authentication.customerName,
  );
  return authentication;
}

export async function register(input: CustomerCreateInput) {
  const authentication = await apiRequest<{
    accessToken: string;
    role: string;
  }>("/auth/register", {
    body: JSON.stringify(input),
    method: "POST",
  });
  localStorage.setItem(tokenKey, authentication.accessToken);
  localStorage.removeItem("cohida-admin-name");
  saveAccount(authentication.accessToken, authentication.role);
  return authentication;
}

export function logout() {
  const token = localStorage.getItem(tokenKey);
  if (token) {
    saveAccounts(
      readSavedAccounts().filter((account) => account.token !== token),
    );
  }
  localStorage.removeItem(tokenKey);
  localStorage.removeItem("cohida-admin-name");
}

export const customerApi = {
  list: (search = "", page = 0, size = 10, status = "ACTIVE", sort = "ASC") => {
    const query = new URLSearchParams({
      search,
      page: String(page),
      size: String(size),
      status,
      sort,
    });
    return apiRequest<{ content: CustomerResponse[]; totalElements: number }>(
      `/customers?${query}`,
    );
  },
  create: (input: CustomerCreateInput) =>
    apiRequest<CustomerResponse>("/customers", {
      body: JSON.stringify(input),
      method: "POST",
    }),
  findById: (id: string) => apiRequest<CustomerResponse>(`/customers/${id}`),
  me: () => apiRequest<CustomerResponse>("/customers/me"),
  updateProfile: (
    input: Pick<CustomerCreateInput, "name" | "birthDate" | "phone" | "email">,
  ) =>
    apiRequest<CustomerResponse>("/customers/me", {
      body: JSON.stringify(input),
      method: "PATCH",
    }),
  changePassword: (
    currentPassword: string,
    newPassword: string,
    newPasswordConfirmation: string,
  ) =>
    apiRequest<void>("/customers/me/password", {
      body: JSON.stringify({
        currentPassword,
        newPassword,
        newPasswordConfirmation,
      }),
      method: "PATCH",
    }),
  deactivateOwnAccount: () =>
    apiRequest<void>("/customers/me/deactivate", { method: "PATCH" }),
  addAddress: (
    input: CustomerAddressInput & { type: "BILLING" | "DELIVERY" },
  ) =>
    apiRequest<
      CustomerAddressInput & { id: number; type: "BILLING" | "DELIVERY" }
    >("/customers/me/addresses", {
      body: JSON.stringify(input),
      method: "POST",
    }),
  updateAddress: (
    id: string,
    input: CustomerAddressInput & { type: "BILLING" | "DELIVERY" },
  ) =>
    apiRequest<
      CustomerAddressInput & { id: number; type: "BILLING" | "DELIVERY" }
    >(`/customers/me/addresses/${id}`, {
      body: JSON.stringify(input),
      method: "PATCH",
    }),
  removeAddress: (id: string) =>
    apiRequest<void>(`/customers/me/addresses/${id}`, { method: "DELETE" }),
  update: (id: string, input: CustomerUpdateInput) =>
    apiRequest<CustomerResponse>(`/customers/${id}`, {
      body: JSON.stringify(input),
      method: "PUT",
    }),
  deactivate: (id: string) =>
    apiRequest<void>(`/customers/${id}/deactivate`, { method: "PATCH" }),
};
