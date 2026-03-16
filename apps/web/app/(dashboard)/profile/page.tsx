'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import { ME_PROFILE_QUERY, UPDATE_PROFILE_MUTATION } from '@/lib/apollo/operations';

export default function ProfilePage() {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [desiredWeeklyHours, setDesiredWeeklyHours] = useState<string>('');
  const [success, setSuccess] = useState<string | null>(null);

  const { data, loading, error } = useQuery<{ me: { id: string; name: string | null } | null }>(
    ME_PROFILE_QUERY,
    { skip: !token }
  );

  const [updateProfile, { loading: saving, error: mutateError }] = useMutation(
    UPDATE_PROFILE_MUTATION,
    {
      refetchQueries: [{ query: ME_PROFILE_QUERY }],
    }
  );

  const me = data?.me ?? null;

  useEffect(() => {
    if (me) {
      setName(me.name ?? '');
      setDesiredWeeklyHours('');
    }
  }, [me]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSuccess(null);
    const desiredNumber =
      desiredWeeklyHours.trim() === '' ? undefined : Number(desiredWeeklyHours);
    try {
      await updateProfile({
        variables: {
          input: {
            name,
            desiredWeeklyHours: Number.isFinite(desiredNumber) ? desiredNumber : undefined,
            availabilities: undefined,
          },
        },
      });
      setSuccess('Profile updated.');
    } catch {
      // error from mutateError
    }
  };

  const displayError = error?.message ?? mutateError?.message ?? null;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-ps-fg-muted">Loading…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-ps-error">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full items-start justify-center">
      <form
        onSubmit={handleSubmit}
        className="mt-4 w-full max-w-lg rounded-ps bg-ps-bg-card p-6 shadow-ps flex flex-col gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">My profile</h1>
          <p className="mt-1 text-ps-sm text-ps-fg-muted">
            Update your name and preferred weekly hours.
          </p>
        </div>
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2.5 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
          />
        </div>
        <div>
          <label htmlFor="desiredWeeklyHours" className="mb-1.5 block text-sm font-medium">
            Desired hours per week
          </label>
          <input
            id="desiredWeeklyHours"
            type="number"
            min={0}
            step={1}
            value={desiredWeeklyHours}
            onChange={(e) => setDesiredWeeklyHours(e.target.value)}
            placeholder="e.g. 36"
            className="w-full rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2.5 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
          />
          <p className="mt-1 text-ps-xs text-ps-fg-muted">
            Managers use this to balance desired vs actual hours in fairness reports.
          </p>
        </div>
        {success && <p className="text-ps-sm text-ps-success">{success}</p>}
        {displayError && <p className="text-ps-sm text-ps-error">{displayError}</p>}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-ps bg-ps-primary px-4 py-2 text-sm font-semibold text-ps-primary-foreground shadow-ps transition-colors hover:bg-ps-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  );
}

