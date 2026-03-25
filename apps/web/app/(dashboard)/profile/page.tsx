'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import { ME_PROFILE_QUERY, UPDATE_PROFILE_MUTATION } from '@/lib/apollo/operations';
import { PageHeader } from '@/libs/ui/PageHeader';
import { ErrorState } from '@/libs/ui/ErrorState';
import { PageSkeleton } from '@/libs/ui/PageSkeleton';
import { Input } from '@/libs/ui/Input';
import { Button } from '@/libs/ui/Button';

const PROFILE_DESCRIPTION =
  'Update your name and preferred weekly hours. Managers use desired hours in fairness reports.';

export default function ProfilePage() {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [desiredWeeklyHours, setDesiredWeeklyHours] = useState<string>('');
  const [success, setSuccess] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery<{
    me: { id: string; name: string | null } | null;
  }>(ME_PROFILE_QUERY, { skip: !token });

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
      <div>
        <PageHeader title="My profile" description={PROFILE_DESCRIPTION} />
        <PageSkeleton lines={4} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <PageHeader title="My profile" description={PROFILE_DESCRIPTION} />
        <ErrorState message={error.message} onRetry={() => refetch()} variant="card" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My profile" description={PROFILE_DESCRIPTION} />
      <div className="flex justify-center">
        <form
          onSubmit={handleSubmit}
          className="mt-2 w-full max-w-lg rounded-ps bg-ps-bg-card p-6 shadow-ps flex flex-col gap-4"
        >
          <Input
            label="Name"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Desired hours per week"
            id="desiredWeeklyHours"
            type="number"
            min={0}
            step={1}
            value={desiredWeeklyHours}
            onChange={(e) => setDesiredWeeklyHours(e.target.value)}
            placeholder="e.g. 36"
            helpText="Managers use this to balance desired vs actual hours in fairness reports."
          />
          {success ? <p className="text-ps-sm text-ps-success">{success}</p> : null}
          {displayError ? <p className="text-ps-sm text-ps-error">{displayError}</p> : null}
          <Button type="submit" variant="primary" loading={saving} loadingLabel="Saving…">
            Save
          </Button>
        </form>
      </div>
    </div>
  );
}

