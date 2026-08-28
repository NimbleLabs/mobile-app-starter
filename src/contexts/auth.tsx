/**
 * Auth context — single source of truth for "who's logged in".
 *
 * Pattern:
 *  - On mount, read any persisted token from secure storage and try to fetch
 *    the current user. If that succeeds, we're signed in.
 *  - signIn / signUp POST to the Rails API, store the returned token, and set
 *    the user in state.
 *  - signOut clears the token and the user.
 *
 * Route gating lives in the (auth) / (authed) layouts — they read `user` from
 * this context and Redirect accordingly.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { api, ApiError } from '@/lib/api';
import { clearToken, setToken } from '@/lib/auth-storage';
import { reportError } from '@/lib/logger';

export type User = {
  id: number;
  email: string;
  name?: string | null;
};

type AuthResponse = { user: User; token: string };

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: { email: string; password: string; name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ user: User }>('/api/v1/users/current');
        if (cancelled) return;
        setUser(res.user);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          // Expired / revoked token: expected, not a bug.
          await clearToken();
        } else {
          // Anything else (5xx, malformed response, unexpected throw) means a
          // user who can't get past the splash — worth an admin's attention.
          reportError(e, { context: { phase: 'auth-bootstrap' } });
        }
        setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function signIn(email: string, password: string) {
    const res = await api.post<AuthResponse>('/api/v1/sessions', { email, password });
    await setToken(res.token);
    setUser(res.user);
  }

  async function signUp(params: { email: string; password: string; name?: string }) {
    const res = await api.post<AuthResponse>('/api/v1/registrations', params);
    await setToken(res.token);
    setUser(res.user);
  }

  async function signOut() {
    // Tell Rails to rotate the token so it can't be reused. Local state still
    // clears even if the server is unreachable or the token was already invalid.
    try {
      await api.delete('/api/v1/sessions');
    } catch {}
    await clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
