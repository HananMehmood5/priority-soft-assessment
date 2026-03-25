'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import type { LocationAttributes, UserRole } from '@shiftsync/shared';
import {
  LOCATIONS_QUERY,
  CREATE_LOCATION_MUTATION,
  UPDATE_LOCATION_MUTATION,
  DELETE_LOCATION_MUTATION,
} from '@/lib/apollo/operations';
import { Modal } from '@/src/components/Modal';
import { EditIcon } from '@/src/components/icons/EditIcon';
import { TrashIcon } from '@/src/components/icons/TrashIcon';
import { PlusIcon } from '@/src/components/icons/PlusIcon';
import { PageHeader } from '@/libs/ui/PageHeader';
import { ErrorState } from '@/libs/ui/ErrorState';
import { PageSkeleton } from '@/libs/ui/PageSkeleton';

const LOCATIONS_DESCRIPTION =
  'Coastal Eats currently operates four locations across two time zones. Admins can use this page to manage the official list of locations.';

type FormMode = { type: 'create' } | { type: 'edit'; location: LocationAttributes };

// Local list of supported timezones for locations.
// If new regions are added, update this list and the API DTOs.
const SUPPORTED_TIMEZONES: readonly string[] = [
  'America/Los_Angeles',
  'America/New_York',
];

export default function LocationsPage() {
  const { token, user } = useAuth();
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<LocationAttributes | null>(null);
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const isAdmin = useMemo(() => user?.role === ('Admin' as UserRole), [user]);

  const { data, loading, error, refetch } = useQuery<{
    locations: LocationAttributes[];
  }>(LOCATIONS_QUERY, { skip: !token });
  const allLocations = data?.locations ?? [];
  const locations = allLocations.filter((loc) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      loc.name.toLowerCase().includes(q) ||
      loc.timezone.toLowerCase().includes(q)
    );
  });

  const [createLocation, { loading: creating }] = useMutation(CREATE_LOCATION_MUTATION, {
    refetchQueries: [{ query: LOCATIONS_QUERY }],
  });
  const [updateLocation, { loading: updating }] = useMutation(UPDATE_LOCATION_MUTATION, {
    refetchQueries: [{ query: LOCATIONS_QUERY }],
  });
  const [deleteLocation, { loading: deleting }] = useMutation(DELETE_LOCATION_MUTATION, {
    refetchQueries: [{ query: LOCATIONS_QUERY }],
  });

  const resetForm = () => {
    setFormMode(null);
    setName('');
    setTimezone('');
    setFormError(null);
  };

  const openCreate = () => {
    setFormMode({ type: 'create' });
    setName('');
    setTimezone('America/Los_Angeles');
    setFormError(null);
  };

  const openEdit = (loc: LocationAttributes) => {
    setFormMode({ type: 'edit', location: loc });
    setName(loc.name);
    setTimezone(loc.timezone);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMode) return;
    if (!name.trim() || !timezone.trim()) {
      setFormError('Name and timezone are required.');
      return;
    }
    setFormError(null);
    try {
      if (formMode.type === 'create') {
        await createLocation({
          variables: { input: { name: name.trim(), timezone: timezone.trim() } },
        });
      } else {
        await updateLocation({
          variables: {
            id: formMode.location.id,
            input: { name: name.trim(), timezone: timezone.trim() },
          },
        });
      }
      resetForm();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Unable to save location.');
    }
  };

  const handleRequestDelete = (loc: LocationAttributes) => {
    setLocationToDelete(loc);
  };

  const handleConfirmDelete = async () => {
    if (!locationToDelete) return;
    try {
      await deleteLocation({ variables: { id: locationToDelete.id } });
    } finally {
      setLocationToDelete(null);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Locations" description={LOCATIONS_DESCRIPTION} />
        <PageSkeleton lines={5} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <PageHeader title="Locations" description={LOCATIONS_DESCRIPTION} />
        <ErrorState message={error.message} onRetry={() => refetch()} variant="card" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Locations"
        description={LOCATIONS_DESCRIPTION}
        action={
          isAdmin ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-ps bg-ps-primary px-4 py-2 text-sm font-semibold text-ps-primary-foreground shadow-ps transition-colors hover:bg-ps-primary-hover"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Add location</span>
            </button>
          ) : undefined
        }
      />
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex justify-end">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or timezone"
            className="w-full max-w-xs rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
          />
        </div>
      </div>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {locations.map((loc) => (
          <li
            key={loc.id}
            className="flex items-center justify-between gap-4 rounded-ps border border-ps-border bg-ps-bg-card p-4"
          >
            <div>
              <div className="font-semibold">{loc.name}</div>
              <div className="mt-1 text-ps-sm text-ps-fg-muted">{loc.timezone}</div>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(loc)}
                  className="inline-flex items-center gap-1.5 rounded-ps border border-ps-border px-3 py-1.5 text-xs font-medium text-ps-fg transition-colors hover:bg-ps-surface-hover"
                >
                  <EditIcon className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRequestDelete(loc)}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 rounded-ps border border-ps-error px-3 py-1.5 text-xs font-medium text-ps-error transition-colors hover:bg-ps-error/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {locations.length === 0 && <p className="text-ps-fg-muted">No locations.</p>}

      {isAdmin && formMode && (
        <Modal
          open
          onClose={resetForm}
          title={formMode.type === 'create' ? 'Add location' : 'Edit location'}
          maxWidth="lg"
          footer={
            <div className="flex items-center gap-2">
              <button
                type="submit"
                form="location-form"
                disabled={creating || updating}
                className="inline-flex items-center justify-center rounded-ps bg-ps-primary px-4 py-2 text-sm font-semibold text-ps-primary-foreground shadow-ps transition-colors hover:bg-ps-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating || updating
                  ? 'Saving…'
                  : formMode.type === 'create'
                  ? 'Create'
                  : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="text-ps-sm text-ps-fg-muted underline-offset-2 hover:underline"
              >
                Cancel
              </button>
            </div>
          }
        >
          <form id="location-form" className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="loc-name" className="mb-1.5 block text-sm font-medium">
                Name
              </label>
              <input
                id="loc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-ps border border-ps-border bg-ps-bg px-3 py-2.5 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
              />
            </div>
            <div>
              <label htmlFor="loc-tz" className="mb-1.5 block text-sm font-medium">
                Timezone
              </label>
              <select
                id="loc-tz"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full appearance-none rounded-ps border border-ps-border bg-ps-bg pl-3 pr-10 py-2.5 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
              >
                {SUPPORTED_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
                {!SUPPORTED_TIMEZONES.includes(timezone) && timezone && (
                  <option value={timezone}>{timezone}</option>
                )}
              </select>
            </div>
            {formError && <p className="text-ps-sm text-ps-error">{formError}</p>}
          </form>
        </Modal>
      )}
      {isAdmin && locationToDelete && (
        <Modal
          open
          onClose={() => setLocationToDelete(null)}
          title="Delete location"
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setLocationToDelete(null)}
                className="text-ps-sm text-ps-fg-muted underline-offset-2 hover:underline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center rounded-ps bg-ps-error px-4 py-2 text-sm font-semibold text-white shadow-ps transition-colors hover:bg-ps-error/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          }
        >
          <p className="text-ps-sm text-ps-fg">
            Delete location “{locationToDelete.name}”? This action cannot be undone and may
            affect existing schedules.
          </p>
        </Modal>
      )}
    </div>
  );
}
