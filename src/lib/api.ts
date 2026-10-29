const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('nodehi_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('nodehi_token', token);
  } else {
    localStorage.removeItem('nodehi_token');
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  try {
    const response = await fetch(url, { ...options, headers });
    const text = await response.text();
    if (!text) {
      return { ok: false, error: { message: 'پاسخی از سرور دریافت نشد.' } } as unknown as T;
    }
    return JSON.parse(text) as T;
  } catch (err: any) {
    return {
      ok: false,
      error: { message: err?.message || 'خطا در ارتباط با سرور' },
    } as unknown as T;
  }
}

export const api = {
  // Installer & Health
  getInstallStatus: () => apiFetch<any>('/install'),
  saveInstallSetup: (payload: Record<string, any>) =>
    apiFetch<any>('/install', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Catalog
  getCategories: () => apiFetch<{ ok: boolean; categories: any[] }>('/categories'),
  getCategory: (slug: string) => apiFetch<{ ok: boolean; category: any }>(`/categories/${slug}`),
  getBrands: () => apiFetch<{ ok: boolean; brands: any[] }>('/brands'),
  getBrand: (slug: string) => apiFetch<{ ok: boolean; brand: any }>(`/brands/${slug}`),
  getProducts: (params: Record<string, string | number | boolean | undefined> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const qs = searchParams.toString();
    return apiFetch<{ ok: boolean; products: any[]; pagination: any }>(`/products${qs ? `?${qs}` : ''}`);
  },
  getProduct: (slug: string) => apiFetch<{ ok: boolean; product: any; related: any[]; reviews: any[] }>(`/products/${slug}`),
  submitReview: (slug: string, body: { author_name: string; rating: number; title?: string; comment: string }) =>
    apiFetch<{ ok: boolean; message: string; error?: any }>(`/products/${slug}/reviews`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  search: (q: string) => apiFetch<{ ok: boolean; products: any[]; categories: any[]; brands: any[] }>(`/search?q=${encodeURIComponent(q)}`),

  // Checkout & Orders
  checkout: (payload: any) =>
    apiFetch<{ ok: boolean; order_number?: string; payment_url?: string; total?: number; error?: any }>('/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  validateCoupon: (code: string, subtotal: number) =>
    apiFetch<{ ok: boolean; discount?: number; error?: any }>('/checkout/validate-coupon', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal }),
    }),
  trackOrder: (order_number: string, phone: string) =>
    apiFetch<{ ok: boolean; order?: any; error?: any }>('/orders/track', {
      method: 'POST',
      body: JSON.stringify({ order_number, phone }),
    }),

  // Auth (OTP)
  requestOtp: (phone: string) =>
    apiFetch<{ ok: boolean; devCode?: string; message: string; error?: any }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),
  verifyOtp: (phone: string, code: string) =>
    apiFetch<{ ok: boolean; token?: string; user?: any; error?: any }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    }),
  getSession: () => apiFetch<{ ok: boolean; user?: any }>('/auth/session'),
  logout: () =>
    apiFetch<{ ok: boolean }>('/auth/logout', {
      method: 'POST',
    }),

  // Account
  getAddresses: () => apiFetch<{ ok: boolean; addresses: any[] }>('/account/addresses'),
  storeAddress: (payload: any) =>
    apiFetch<{ ok: boolean; address: any }>('/account/addresses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteAddress: (id: number) =>
    apiFetch<{ ok: boolean }>(`/account/addresses/${id}`, {
      method: 'DELETE',
    }),
  getUserOrders: () => apiFetch<{ ok: boolean; orders: any[]; pagination: any }>('/account/orders'),

  // Content
  getArticles: (params: { category?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return apiFetch<{ ok: boolean; articles: any[]; categories: any[] }>(`/articles${qs ? `?${qs}` : ''}`);
  },
  getArticle: (slug: string) =>
    apiFetch<{ ok: boolean; article: any; relatedArticles: any[]; relatedProducts: any[] }>(`/articles/${slug}`),
  getFaqs: () => apiFetch<{ ok: boolean; categories: any[] }>('/faqs'),
  getLegal: (slug: string) => apiFetch<{ ok: boolean; page: any }>(`/legal/${slug}`),
  getLoyalty: () => apiFetch<{ ok: boolean; tiers: any[]; installments: any[]; steps: any[] }>('/loyalty'),

  // Engagement
  submitContact: (payload: { name: string; phone: string; email?: string; subject: string; message: string }) =>
    apiFetch<{ ok: boolean; message: string; error?: any }>('/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  submitStockAlert: (payload: { product_id: number; phone: string; email?: string }) =>
    apiFetch<{ ok: boolean; message: string; error?: any }>('/stock-alerts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Settings
  getPublicSettings: () => apiFetch<{ ok: boolean; settings: any }>('/settings/public'),
  getPaymentMethods: () => apiFetch<{ ok: boolean; methods: any[] }>('/payments/methods'),

  // Admin
  getAdminDashboard: () => apiFetch<{ ok: boolean; stats: any; recentOrders: any[] }>('/admin/dashboard'),
  getAdminOrders: (status?: string) =>
    apiFetch<{ ok: boolean; orders: any[]; pagination: any }>(`/admin/orders${status ? `?status=${status}` : ''}`),
  updateAdminOrderStatus: (id: number, status: string, tracking_code?: string) =>
    apiFetch<{ ok: boolean; order: any }>(`/admin/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, tracking_code }),
    }),
  updateAdminSettings: (values: Record<string, any>) =>
    apiFetch<{ ok: boolean; settings?: any; message?: string; error?: any }>('/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ values }),
    }),
};

