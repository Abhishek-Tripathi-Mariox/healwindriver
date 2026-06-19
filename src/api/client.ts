import { API_BASE_URL } from '../config';
import { storage } from './storage';

/**
 * HTTP client. The backend returns { code, message, data } (code 1 = success)
 * on most routes and { success, data } on some; `request` normalizes both,
 * returns `data` on success, throws ApiError otherwise, and attaches the Bearer
 * token automatically.
 */
export class ApiError extends Error {
  status: number;
  code?: number;
  constructor(message: string, status: number, code?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

let onUnauthorized: (() => void) | null = null;
export const setOnUnauthorized = (fn: () => void) => {
  onUnauthorized = fn;
};

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  auth?: boolean;
  isForm?: boolean;
  query?: Record<string, string | number | boolean | undefined>;
}

const buildQuery = (q?: RequestOptions['query']): string => {
  if (!q) return '';
  const parts = Object.entries(q)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

export async function request<T = any>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, isForm = false, query } = opts;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = await storage.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  // Abort hung requests so a slow/unreachable server can't trap the UI
  // (e.g. the splash waiting on a stale-token profile fetch).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e: any) {
    throw new ApiError(
      e?.name === 'AbortError'
        ? 'Request timed out — check your connection and the server.'
        : 'Network error — check your connection and the server.',
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  let json: any = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  const code: number | undefined = json?.code;
  const ok = res.ok && (code === undefined ? json?.success !== false : code === 1);
  if (!ok) {
    const message =
      json?.message ||
      json?.rData?.hint ||
      json?.data?.hint ||
      json?.rMsg ||
      `Request failed (${res.status})`;
    if (res.status === 401 || code === 3) onUnauthorized?.();
    throw new ApiError(message, res.status, code);
  }
  return (json?.data ?? json) as T;
}

export const api = {
  get: <T = any>(path: string, query?: RequestOptions['query'], auth = true) =>
    request<T>(path, { method: 'GET', query, auth }),
  post: <T = any>(path: string, body?: any, auth = true) =>
    request<T>(path, { method: 'POST', body, auth }),
  put: <T = any>(path: string, body?: any, auth = true) =>
    request<T>(path, { method: 'PUT', body, auth }),
  del: <T = any>(path: string, auth = true) => request<T>(path, { method: 'DELETE', auth }),
  // Multipart uploads (FormData) — Content-Type is left unset so fetch adds the
  // multipart boundary itself.
  postForm: <T = any>(path: string, form: FormData, auth = true) =>
    request<T>(path, { method: 'POST', body: form, isForm: true, auth }),
  putForm: <T = any>(path: string, form: FormData, auth = true) =>
    request<T>(path, { method: 'PUT', body: form, isForm: true, auth }),
};
