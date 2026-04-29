export interface Student {
  id: string;
  name: string;
  allergens: string[];
  parentId: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  allergens: string[];
  available: boolean;
}

export interface Parent {
  id: string;
  name: string;
  walletBalance: number;
}

export interface OrderResponse {
  id: string;
  studentId: string;
  items: { menuItemId: string; quantity: number }[];
  total: number;
  createdAt: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

type CreateOrderRequest = {
  studentId: string;
  items: { menuItemId: string; quantity: number }[];
};

const HEADERS = { 'Content-Type': 'application/json' };
const API = {
  STUDENTS: '/students',
  MENU_ITEMS: '/menu-items',
  PARENTS: (id: string) => `/parents/${id}`,
  ORDERS: '/orders',
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { ...HEADERS, ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw body as ApiError;
  return body as T;
}

export const api = {
  students: () => request<Student[]>(API.STUDENTS),
  menuItems: () => request<MenuItem[]>(API.MENU_ITEMS),
  parent: (id: string) => request<Parent>(API.PARENTS(id)),
  createOrder: (body: CreateOrderRequest) =>
    request<OrderResponse>(API.ORDERS, { method: 'POST', body: JSON.stringify(body) }),
};
