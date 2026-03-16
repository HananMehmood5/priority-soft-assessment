'use client';

import Image from 'next/image';
import { useCallback, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login, error, clearError } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      clearError();
      setSubmitting(true);
      try {
        await login(email, password);
        router.replace('/');
      } catch {
        // error set in context
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, login, router, clearError]
  );

  return (
    <main className="relative min-h-screen bg-ps-bg text-ps-fg">
      <div className="absolute left-1/2 top-[25%] flex -translate-x-1/2 -translate-y-1/2 justify-center">
        <Image
          src="/priority-soft-logo.png"
          alt="Priority Soft"
          width={220}
          height={48}
          className="h-auto w-auto max-w-full"
        />
      </div>
      <div className="absolute left-1/2 top-1/2 w-full max-w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-ps-lg bg-ps-bg-card p-6 shadow-ps-lg">
        <p className="mb-6 text-ps-sm text-ps-fg-muted">
          Sign in to continue
        </p>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-ps border border-ps-border bg-ps-bg-elevated px-3 py-2.5 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-ps border border-ps-border bg-ps-bg-elevated px-3 py-2.5 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
            />
          </div>
          {error && (
            <p className="mt-1 text-ps-sm text-ps-error">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex items-center justify-center rounded-ps bg-ps-primary px-4 py-2 text-sm font-semibold text-ps-primary-foreground shadow-ps transition-colors hover:bg-ps-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
