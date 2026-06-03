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
        const me = await api.get<{ user: User } | User>('/api/v1/users/current');
        if (cancelled) return;
        // The Rails endpoint may return either { user: {...} } or the user object directly,
        // depending on the JSON view. Handle both.
        const u = (me as { user?: User }).user ?? (me as User);
        setUser(u && (u as User).id ? (u as User) : null);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          // No valid token; that's fine, just not signed in.
          await clearToken();
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
