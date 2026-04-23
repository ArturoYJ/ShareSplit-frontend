interface FetchOptions extends RequestInit {
  token?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface GroupSummary {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  role: 'owner' | 'member';
  member_count: number;  // COUNT() de PostgreSQL se castea a number
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  role: 'owner' | 'member';
  joined_at: string;
}

export interface GroupDetailResponse {
  group: {
    id: string;
    name: string;
    invite_code: string;
    created_at: string;
  };
  members: GroupMember[];
}

export interface ExpenseListItem {
  id: string;
  group_id: string;
  title: string;
  place: string | null;
  total_amount: string;
  paid_by: string;
  paid_by_name: string;
  status: 'draft' | 'open' | 'settled';
  expense_date: string;
  created_at: string;
  item_count: string;
}

export interface ExpenseItemInput {
  name: string;
  unit_price: number;
  quantity?: number;
}

export interface ExpenseCreateInput {
  title: string;
  place?: string;
  expense_date?: string;
  notes?: string;
  items: ExpenseItemInput[];
}

export interface ExpenseItemDetail {
  id: string;
  name: string;
  unit_price: string;
  quantity: string;
  total_price: string;
  claimants: Array<{ user_id: string; name: string }>;
  claimant_count: string;
  is_claimed_by_me: boolean;
  price_per_person: string;
  my_share: string;
}

export interface ExpenseDetailResponse {
  expense: {
    id: string;
    group_id: string;
    title: string;
    place: string | null;
    total_amount: string;
    paid_by: string;
    paid_by_name: string;
    status: 'draft' | 'open' | 'settled';
    expense_date: string;
    notes: string | null;
    created_at: string;
  };
  items: ExpenseItemDetail[];
}

export interface BalanceRow {
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  total_paid: number;
  total_owed: number;
  payments_sent: number;
  payments_received: number;
  net_balance: number;
}

export interface DebtRow {
  from_user_id: string;
  from_name: string;
  to_user_id: string;
  to_name: string;
  amount: number;
}

export interface PaymentRow {
  id: string;
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  from_name: string;
  to_name: string;
  amount: string;
  note: string | null;
  paid_at: string;
  created_at: string;
}

/** Respuesta paginada del listado de gastos */
export interface PaginatedExpensesResponse {
  expenses: ExpenseListItem[];
  total: number;
  page: number;
  limit: number;
}

/** Respuesta paginada del historial de pagos */
export interface PaginatedPaymentsResponse {
  payments: PaymentRow[];
  total: number;
  page: number;
  limit: number;
}

/** Input para actualizar el perfil del usuario */
export interface UpdateMeInput {
  name?: string;
  email?: string;
  avatar_url?: string | null;
}

export interface ApiErrorPayload {
  error?: string;
  code?: string;
  details?: unknown;
  errors?: Array<{ msg: string }>;
  unclaimed_items?: unknown[];
}

export class ApiError extends Error {
  status: number;
  payload: ApiErrorPayload;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.error || payload.errors?.[0]?.msg || 'Error en la petición');
    this.status = status;
    this.payload = payload;
  }
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers || {});
  if (!(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
    // Incluye cookies httpOnly en todas las peticiones (para ss_token)
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') || '';
  const hasJson = contentType.includes('application/json');
  const payload = (hasJson ? await response.json() : {}) as ApiErrorPayload;

  if (!response.ok) {
    throw new ApiError(response.status, payload);
  }

  return payload as T;
}

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: (user: { name: string; email: string; password: string }) =>
    apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(user),
    }),
  /** Obtiene el perfil actual. Si se llama sin token, la cookie ss_token autentica la request.
   *  La respuesta incluye token para restaurar la sesión en memoria. */
  me: (token?: string) => apiFetch<{ user: User; token: string | null }>('/auth/me', { token }),
  updateMe: (data: UpdateMeInput, token: string) =>
    apiFetch<{ user: User }>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),
  /** Llama al backend para limpiar la cookie httpOnly de sesión */
  logout: () =>
    apiFetch<{ message: string }>('/auth/logout', { method: 'POST' }),
};

export const groupsApi = {
  list: (token: string) => apiFetch<{ groups: GroupSummary[] }>('/groups', { token }),
  create: (name: string, token: string) =>
    apiFetch<{ group: { id: string; name: string; invite_code: string; created_at: string } }>('/groups', {
      method: 'POST',
      body: JSON.stringify({ name }),
      token,
    }),
  join: (inviteCode: string, token: string) =>
    apiFetch<{ message: string; group: { id: string; name: string; invite_code: string } }>('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ invite_code: inviteCode }),
      token,
    }),
  get: (id: string, token: string) => apiFetch<GroupDetailResponse>(`/groups/${id}`, { token }),
  delete: (id: string, token: string) =>
    apiFetch<{ message: string }>(`/groups/${id}`, { method: 'DELETE', token }),
  removeMember: (groupId: string, userId: string, token: string) =>
    apiFetch<{ message: string }>(`/groups/${groupId}/members/${userId}`, { method: 'DELETE', token }),
  leave: (groupId: string, userId: string, token: string) =>
    apiFetch<{ message: string }>(`/groups/${groupId}/members/${userId}/leave`, { method: 'DELETE', token }),
  transferOwner: (groupId: string, newOwnerId: string, token: string) =>
    apiFetch<{ message: string }>(`/groups/${groupId}/transfer-owner`, {
      method: 'PATCH',
      body: JSON.stringify({ new_owner_id: newOwnerId }),
      token,
    }),
};

export const expensesApi = {
  list: (groupId: string, token: string) =>
    apiFetch<{ expenses: ExpenseListItem[] }>(`/groups/${groupId}/expenses`, { token }),
  create: (groupId: string, expense: ExpenseCreateInput, token: string) =>
    apiFetch<{ expense: { id: string } }>(`/groups/${groupId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(expense),
      token,
    }),
  get: (groupId: string, expenseId: string, token: string) =>
    apiFetch<ExpenseDetailResponse>(`/groups/${groupId}/expenses/${expenseId}`, { token }),
  updateStatus: (groupId: string, expenseId: string, status: 'draft' | 'open' | 'settled', token: string) =>
    apiFetch<{ expense: { id: string; status: 'draft' | 'open' | 'settled' } }>(
      `/groups/${groupId}/expenses/${expenseId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        token,
      }
    ),
  delete: (groupId: string, expenseId: string, token: string) =>
    apiFetch<{ message: string }>(`/groups/${groupId}/expenses/${expenseId}`, {
      method: 'DELETE',
      token,
    }),
};

export const claimsApi = {
  toggle: (groupId: string, expenseId: string, itemId: string, token: string) =>
    apiFetch<{ claimed: boolean }>(`/groups/${groupId}/expenses/${expenseId}/items/${itemId}/claim`, {
      method: 'PUT',
      token,
    }),
  getMyClaims: (groupId: string, expenseId: string, token: string) =>
    apiFetch<{ claimed_item_ids: string[] }>(`/groups/${groupId}/expenses/${expenseId}/items/my-claims`, { token }),
};

export const balancesApi = {
  get: (groupId: string, token: string) =>
    apiFetch<{ balances: BalanceRow[]; debts: DebtRow[] }>(`/groups/${groupId}/balances`, { token }),
  pay: (
    groupId: string,
    payment: { to_user_id: string; amount: number; note?: string },
    token: string
  ) =>
    apiFetch<{ payment: PaymentRow }>(`/groups/${groupId}/payments`, {
      method: 'POST',
      body: JSON.stringify(payment),
      token,
    }),
  getPayments: (groupId: string, token: string) =>
    apiFetch<{ payments: PaymentRow[] }>(`/groups/${groupId}/payments`, { token }),
  settleAll: (groupId: string, token: string) =>
    apiFetch<{ message: string; settled_count: number }>(`/groups/${groupId}/settle-all`, {
      method: 'POST',
      token,
    }),
};
