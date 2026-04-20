const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiFetch(endpoint: string, options: FetchOptions = {}) {
  const { token, ...fetchOptions } = options;
  
  const headers = new Headers(fetchOptions.headers || {});
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.errors?.[0]?.msg || 'Error en la petición');
  }

  return data;
}

// Módulo Auth
export const authApi = {
  login: (credentials: any) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (user: any) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(user) }),
  me: (token: string) => apiFetch('/auth/me', { token }),
};

// Módulo Grupos
export const groupsApi = {
  list: (token: string) => apiFetch('/groups', { token }),
  create: (name: string, token: string) => apiFetch('/groups', { method: 'POST', body: JSON.stringify({ name }), token }),
  join: (invite_code: string, token: string) => apiFetch('/groups/join', { method: 'POST', body: JSON.stringify({ invite_code }), token }),
  get: (id: string, token: string) => apiFetch(`/groups/${id}`, { token }),
};

// Módulo Gastos
export const expensesApi = {
  list: (groupId: string, token: string) => apiFetch(`/groups/${groupId}/expenses`, { token }),
  create: (groupId: string, expense: any, token: string) => apiFetch(`/groups/${groupId}/expenses`, { method: 'POST', body: JSON.stringify(expense), token }),
  get: (groupId: string, expenseId: string, token: string) => apiFetch(`/groups/${groupId}/expenses/${expenseId}`, { token }),
  updateStatus: (groupId: string, expenseId: string, status: string, token: string) => 
    apiFetch(`/groups/${groupId}/expenses/${expenseId}/status`, { method: 'PATCH', body: JSON.stringify({ status }), token }),
};

// Módulo Reclamos
export const claimsApi = {
  toggle: (groupId: string, expenseId: string, itemId: string, token: string) => 
    apiFetch(`/groups/${groupId}/expenses/${expenseId}/items/${itemId}/claim`, { method: 'PUT', token }),
  getMyClaims: (groupId: string, expenseId: string, token: string) => 
    apiFetch(`/groups/${groupId}/expenses/${expenseId}/items/my-claims`, { token }),
};

// Módulo Balances
export const balancesApi = {
  get: (groupId: string, token: string) => apiFetch(`/groups/${groupId}/balances`, { token }),
  pay: (groupId: string, payment: any, token: string) => apiFetch(`/groups/${groupId}/payments`, { method: 'POST', body: JSON.stringify(payment), token }),
  getPayments: (groupId: string, token: string) => apiFetch(`/groups/${groupId}/payments`, { token }),
};
