'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import type { LocationAttributes } from '@shiftsync/shared';
import { useIsAdmin } from '@/lib/hooks/use-role';
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
import { QueryStateBoundary } from '@/libs/ui/QueryStateBoundary';
import { Button } from '@/libs/ui/Button';
import { Card } from '@/libs/ui/Card';
import { Input } from '@/libs/ui/Input';
import { Select } from '@/libs/ui/Select';

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
  const { token } = useAuth();
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<LocationAttributes | null>(null);
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const isAdmin = useIsAdmin();

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

  return (
    <div>
      <PageHeader
        title="Locations"
        description={LOCATIONS_DESCRIPTION}
        action={
          isAdmin ? (
            <Button type="button" variant="primary" onClick={openCreate}>
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Add location</span>
            </Button>
          ) : undefined
        }
      />
      <QueryStateBoundary
        loading={loading}
        error={error}
        skeletonLines={5}
        onRetry={() => refetch()}
      >
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex justify-end">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or timezone"
            className="w-full max-w-xs"
            aria-label="Search locations by name or timezone"
          />
        </div>
      </div>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {locations.map((loc) => (
          <li key={loc.id}>
            <Card className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold">{loc.name}</div>
              <div className="mt-1 text-ps-sm text-ps-fg-muted">{loc.timezone}</div>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => openEdit(loc)}
                  className="gap-1.5"
                >
                  <EditIcon className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => handleRequestDelete(loc)}
                  disabled={deleting}
                  className="gap-1.5"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </Button>
              </div>
            )}
            </Card>
          </li>
        ))}
      </ul>
      {locations.length === 0 && <p className="text-ps-fg-muted">No locations.</p>}
      </QueryStateBoundary>

      {isAdmin && formMode && (
        <Modal
          open
          onClose={resetForm}
          title={formMode.type === 'create' ? 'Add location' : 'Edit location'}
          maxWidth="lg"
          footer={
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                form="location-form"
                variant="primary"
                disabled={creating || updating}
                loading={creating || updating}
                loadingLabel="Saving…"
              >
                {formMode.type === 'create' ? 'Create' : 'Save changes'}
              </Button>
              <Button
                type="button"
                variant="ghostLink"
                onClick={resetForm}
              >
                Cancel
              </Button>
            </div>
          }
        >
          <form id="location-form" className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <Input
              id="loc-name"
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Select
              id="loc-tz"
              label="Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {SUPPORTED_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
              {!SUPPORTED_TIMEZONES.includes(timezone) && timezone && (
                <option value={timezone}>{timezone}</option>
              )}
            </Select>
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
              <Button
                type="button"
                variant="ghostLink"
                onClick={() => setLocationToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleting}
                loading={deleting}
              >
                Delete
              </Button>
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
