const baseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";
const tokenKey = "cohida-access-token";

type SessionRole = "ADMIN" | "CUSTOMER";

export function getSessionRole(): SessionRole | null {
  const token = localStorage.getItem(tokenKey);
  const encodedPayload = token?.split(".")[1];
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
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    if (response.status === 401 || response.status === 403) {
      logout();
      if (window.location.pathname !== "/entrar") {
        window.location.replace("/entrar");
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
  return authentication;
}

export function logout() {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem("cohida-admin-name");
}

export const customerApi = {
  list: (search = "", page = 0, size = 20) =>
    apiRequest<{ content: CustomerResponse[]; totalElements: number }>(
      `/customers?search=${encodeURIComponent(search)}&page=${page}&size=${size}`,
    ),
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
