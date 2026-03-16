'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { UserAttributes } from '@shiftsync/shared';
import { apolloClient } from '@/lib/apollo/client';
import { ME_QUERY, LOGIN_MUTATION } from '@/lib/apollo/operations';

const TOKEN_KEY = 'shiftsync_token';

type AuthState = {
  token: string | null;
  user: UserAttributes | null;
  loading: boolean;
  error: string | null;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<UserAttributes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setToken = useCallback((t: string | null) => {
    if (typeof window === 'undefined') return;
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
    setTokenState(t);
  }, []);

  const loadUser = useCallback(async () => {
    const res = await apolloClient.query<{ me: UserAttributes }>({
      query: ME_QUERY,
    });
    if (res.data?.me) setUser(res.data.me);
    else setUser(null);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setTokenState(null);
      setUser(null);
      setLoading(false);
      return;
    }
    setTokenState(stored);
    apolloClient
      .query<{ me: UserAttributes }>({ query: ME_QUERY })
      .then((res) => {
        if (res.data?.me) setUser(res.data.me);
        else setUser(null);
      })
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [setToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      const res = await apolloClient.mutate<{ login: string | null }>({
        mutation: LOGIN_MUTATION,
        variables: { input: { email, password } },
      });
      const t = res.data?.login ?? null;
      if (!t) {
        setError('Invalid email or password');
        throw new Error('Invalid email or password');
      }
      setToken(t);
      await loadUser();
    },
    [setToken, loadUser]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setError(null);
    apolloClient.clearStore();
  }, [setToken]);

  const clearError = useCallback(() => setError(null), []);

  const value: AuthContextValue = {
    token,
    user,
    loading,
    error,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
