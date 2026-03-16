'use client';

import { useQuery } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import type { LocationAttributes } from '@shiftsync/shared';
import { LOCATIONS_QUERY } from '@/lib/apollo/operations';

export default function LocationsPage() {
  const { token } = useAuth();
  const { data, loading, error } = useQuery<{
    locations: LocationAttributes[];
  }>(LOCATIONS_QUERY, { skip: !token });
  const locations = data?.locations ?? [];

  if (loading) return <p className="text-ps-fg-muted">Loading locations…</p>;
  if (error) return <p className="text-ps-error">{error.message}</p>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Locations</h1>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {locations.map((loc) => (
          <li
            key={loc.id}
            className="rounded-ps border border-ps-border bg-ps-bg-card p-4"
          >
            <div className="font-semibold">{loc.name}</div>
            <div className="mt-1 text-ps-sm text-ps-fg-muted">{loc.timezone}</div>
          </li>
        ))}
      </ul>
      {locations.length === 0 && <p className="text-ps-fg-muted">No locations.</p>}
    </div>
  );
}
