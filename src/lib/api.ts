/**
 * Thin fetch wrapper around the Rails API.
 *
 * - Reads base URL from EXPO_PUBLIC_API_URL.
 * - Adds `x-api-token` header automatically when a token is stored.
 * - Adds the Ahoy visit/visitor headers so server-side analytics can attribute
 *   the request to a device and session (see ./visit).
 * - Parses JSON, surfaces error messages from the Rails error envelope.
 *
 * Usage:
 *   const me = await api.get<{ user: User }>('/api/v1/users/current');
 *   const session = await api.post<{ token: string; user: User }>(
 *     '/api/v1/sessions',
 *     { email, password }
 *   );
 */
import { getToken } from './auth-storage';
import { visitHeaders } from './visit';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  const [token, visit] = await Promise.all([getToken(), visitHeaders()]);
  // FormData (file upload) must NOT be JSON-encoded, and the browser/RN sets its
  // own multipart Content-Type (with boundary) — so we omit ours for it.
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { 'x-api-token': token } : {}),
    // Ahoy visit/visitor identity. Sent on every request so the events Rails
    // records itself land on the same visit as the ones the app reports.
    ...visit,
    ...((init?.headers as Record<string, string> | undefined) ?? {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    method,
    headers,
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  });

  const text = await res.text();
  const parsed = text ? safeJson(text) : null;

  if (!res.ok) {
    const message = extractErrorMessage(parsed) ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status, parsed);
  }

  return parsed as T;
}

function safeJson(text: string): unknown {
  try { return JSON.parse(text); } catch { return text; }
}

function extractErrorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const b = body as Record<string, unknown>;
  if (typeof b.error === 'string') return b.error;
  if (b.errors && typeof b.errors === 'object') {
    const first = Object.entries(b.errors as Record<string, unknown>)[0];
    if (first) {
      const [field, messages] = first;
      const msg = Array.isArray(messages) ? messages[0] : String(messages);
      return `${field} ${msg}`;
    }
  }
  return undefined;
}

export const api = {
  get:  <T>(path: string, init?: RequestInit)               => request<T>('GET',    path, undefined, init),
  post: <T>(path: string, body?: unknown, init?: RequestInit) => request<T>('POST',   path, body, init),
  put:  <T>(path: string, body?: unknown, init?: RequestInit) => request<T>('PUT',    path, body, init),
  patch:<T>(path: string, body?: unknown, init?: RequestInit) => request<T>('PATCH',  path, body, init),
  delete:<T>(path: string, init?: RequestInit)              => request<T>('DELETE', path, undefined, init),
};
