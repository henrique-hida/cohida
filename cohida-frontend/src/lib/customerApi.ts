import { logout, saveAccount, tokenKey } from './customer/session';

export {
  getSavedAccounts,
  getSessionRole,
  hasAdminSession,
  logout,
  switchAccount,
  updateCurrentAccountName,
} from './customer/session';
export type { SavedAccount, SessionRole } from './customer/session';

const baseUrl =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
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
  'password' | 'passwordConfirmation'
> {
  id: number;
  code: string;
  active: boolean;
  addresses: Array<
    CustomerAddressInput & {
      id: number;
      type: 'BILLING' | 'DELIVERY';
    }
  >;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem(tokenKey);
  const headers = new Headers(options.headers);
  const isMultipartBody =
    typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isMultipartBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });
  if (token && localStorage.getItem(tokenKey) !== token) {
    throw new Error('A conta mudou durante a operação.');
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    if (token && localStorage.getItem(tokenKey) !== token) {
      throw new Error('A conta mudou durante a operação.');
    }
    const isAuthenticationEndpoint = path.startsWith('/auth/');
    if (response.status === 401 && token && !isAuthenticationEndpoint) {
      // Do not let an in-flight request from an old session erase a newer
      // token just saved by a successful login.
      if (localStorage.getItem(tokenKey) === token) {
        logout();
        if (window.location.pathname !== '/entrar') {
          window.location.replace('/entrar');
        }
      }
      throw new Error('Sua sessão expirou. Entre novamente para continuar.');
    }
    throw new ApiError(
      body?.message ??
        (response.status === 403
          ? 'Você não tem permissão para realizar esta ação.'
          : 'Não foi possível concluir a operação.'),
      response.status,
    );
  }
  const data = response.status === 204 ? undefined : await response.json();
  if (token && localStorage.getItem(tokenKey) !== token) {
    throw new Error('A conta mudou durante a operação.');
  }
  return data as T;
}

export async function login(email: string, password: string) {
  const authentication = await apiRequest<{
    accessToken: string;
    role: string;
    customerName?: string;
  }>('/auth/login', {
    body: JSON.stringify({ email, password }),
    method: 'POST',
  });
  localStorage.setItem(tokenKey, authentication.accessToken);
  localStorage.removeItem('cohida-admin-name');
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
  }>('/auth/register', {
    body: JSON.stringify(input),
    method: 'POST',
  });
  localStorage.setItem(tokenKey, authentication.accessToken);
  localStorage.removeItem('cohida-admin-name');
  saveAccount(authentication.accessToken, authentication.role);
  return authentication;
}

export const customerApi = {
  list: (search = '', page = 0, size = 10, status = 'ACTIVE', sort = 'ASC') => {
    const query = new URLSearchParams({
      search,
      page: String(page),
      size: String(size),
      status,
      sort,
    });
    return apiRequest<{
      content: CustomerResponse[];
      totalElements: number;
    }>(`/customers?${query}`);
  },
  create: (input: CustomerCreateInput) =>
    apiRequest<CustomerResponse>('/customers', {
      body: JSON.stringify(input),
      method: 'POST',
    }),
  findById: (id: string) => apiRequest<CustomerResponse>(`/customers/${id}`),
  me: () => apiRequest<CustomerResponse>('/customers/me'),
  updateProfile: (
    input: Pick<CustomerCreateInput, 'name' | 'birthDate' | 'phone' | 'email'>,
  ) =>
    apiRequest<CustomerResponse>('/customers/me', {
      body: JSON.stringify(input),
      method: 'PATCH',
    }),
  changePassword: (
    currentPassword: string,
    newPassword: string,
    newPasswordConfirmation: string,
  ) =>
    apiRequest<void>('/customers/me/password', {
      body: JSON.stringify({
        currentPassword,
        newPassword,
        newPasswordConfirmation,
      }),
      method: 'PATCH',
    }),
  deactivateOwnAccount: () =>
    apiRequest<void>('/customers/me/deactivate', {
      method: 'PATCH',
    }),
  addAddress: (
    input: CustomerAddressInput & {
      type: 'BILLING' | 'DELIVERY';
    },
  ) =>
    apiRequest<
      CustomerAddressInput & {
        id: number;
        type: 'BILLING' | 'DELIVERY';
      }
    >('/customers/me/addresses', {
      body: JSON.stringify(input),
      method: 'POST',
    }),
  updateAddress: (
    id: string,
    input: CustomerAddressInput & {
      type: 'BILLING' | 'DELIVERY';
    },
  ) =>
    apiRequest<
      CustomerAddressInput & {
        id: number;
        type: 'BILLING' | 'DELIVERY';
      }
    >(`/customers/me/addresses/${id}`, {
      body: JSON.stringify(input),
      method: 'PATCH',
    }),
  removeAddress: (id: string) =>
    apiRequest<void>(`/customers/me/addresses/${id}`, {
      method: 'DELETE',
    }),
  update: (id: string, input: CustomerUpdateInput) =>
    apiRequest<CustomerResponse>(`/customers/${id}`, {
      body: JSON.stringify(input),
      method: 'PUT',
    }),
  deactivate: (id: string) =>
    apiRequest<void>(`/customers/${id}/deactivate`, {
      method: 'PATCH',
    }),
};
