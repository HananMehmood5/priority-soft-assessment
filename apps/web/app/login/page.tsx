'use client';

import Image from 'next/image';
import { useCallback, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Input } from '@/libs/ui/Input';
import { Button } from '@/libs/ui/Button';

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
    [email, password, login, router, clearError],
  );

  return (
    <main className="flex min-h-screen flex-col items-center bg-ps-bg px-4 py-12 text-ps-fg">
      <div className="mb-10">
        <Image
          src="/priority-soft-logo.png"
          alt="Priority Soft"
          width={220}
          height={48}
          className="h-auto w-auto max-w-full"
          priority
        />
      </div>
      <div className="w-full max-w-[400px] rounded-ps-lg bg-ps-bg-card p-6 shadow-ps-lg">
        <p className="mb-6 text-ps-sm text-ps-fg-muted">Sign in to continue</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? <p className="text-ps-sm text-ps-error">{error}</p> : null}
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            loadingLabel="Signing in…"
            className="mt-1 w-full"
          >
            Sign in
          </Button>
        </form>
      </div>
    </main>
  );
}
