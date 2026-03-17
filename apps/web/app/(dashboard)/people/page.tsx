'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@shiftsync/shared';
import {
  STAFF_QUERY,
  LOCATIONS_QUERY,
  SKILLS_QUERY_MINIMAL,
  CERTIFY_STAFF_MUTATION,
  REMOVE_STAFF_FROM_LOCATION_MUTATION,
  ASSIGN_SKILL_TO_STAFF_MUTATION,
  REMOVE_SKILL_FROM_STAFF_MUTATION,
  REGISTER_MUTATION,
} from '@/lib/apollo/operations';
import { Modal } from '@/src/components/Modal';
import { EditIcon } from '@/src/components/icons/EditIcon';
import { PlusIcon } from '@/src/components/icons/PlusIcon';

type StaffMember = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  skills: Array<{ id: string; name: string }>;
  certifiedLocations: Array<{ id: string; name: string }>;
};

export default function PeoplePage() {
  const { token, user } = useAuth();
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [detailUser, setDetailUser] = useState<StaffMember | null>(null);
  const [addLocationId, setAddLocationId] = useState('');
  const [addSkillId, setAddSkillId] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.Staff);
  const [createError, setCreateError] = useState<string | null>(null);

  const canAccess =
    user?.role === UserRole.Admin || user?.role === UserRole.Manager;

  const { data: staffData, loading: staffLoading, error: staffError } = useQuery<{
    staff: StaffMember[];
  }>(STAFF_QUERY, {
    variables: {
      locationId: locationFilter || null,
      skillId: skillFilter || null,
      role: roleFilter || null,
    },
    skip: !token || !canAccess,
  });

  const { data: locationsData } = useQuery<{ locations: { id: string; name: string }[] }>(
    LOCATIONS_QUERY,
    { skip: !token },
  );
  const { data: skillsData } = useQuery<{ skills: { id: string; name: string }[] }>(
    SKILLS_QUERY_MINIMAL,
    { skip: !token },
  );

  const staffQueryRefetch = { query: STAFF_QUERY };
  const [certifyStaff] = useMutation(CERTIFY_STAFF_MUTATION, {
    refetchQueries: [staffQueryRefetch],
  });
  const [removeStaffFromLocation] = useMutation(REMOVE_STAFF_FROM_LOCATION_MUTATION, {
    refetchQueries: [staffQueryRefetch],
  });
  const [assignSkill] = useMutation(ASSIGN_SKILL_TO_STAFF_MUTATION, {
    refetchQueries: [staffQueryRefetch],
  });
  const [removeSkill] = useMutation(REMOVE_SKILL_FROM_STAFF_MUTATION, {
    refetchQueries: [staffQueryRefetch],
  });
  const [registerUser, { loading: registering }] = useMutation(REGISTER_MUTATION, {
    refetchQueries: [staffQueryRefetch],
  });

  const allStaff = staffData?.staff ?? [];
  const locations = locationsData?.locations ?? [];
  const skills = skillsData?.skills ?? [];

  const staff = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allStaff;
    return allStaff.filter(
      (s) =>
        (s.name?.toLowerCase().includes(q) ?? false) ||
        s.email.toLowerCase().includes(q),
    );
  }, [allStaff, search]);

  const openDetail = (s: StaffMember) => {
    setDetailUser(s);
    setAddLocationId('');
    setAddSkillId('');
    setActionError(null);
  };

  const handleCertify = async () => {
    if (!detailUser || !addLocationId) return;
    setActionError(null);
    try {
      await certifyStaff({
        variables: { locationId: addLocationId, staffId: detailUser.id },
      });
      setAddLocationId('');
      setDetailUser((prev) =>
        prev
          ? {
              ...prev,
              certifiedLocations: [
                ...prev.certifiedLocations,
                locations.find((l) => l.id === addLocationId)!,
              ],
            }
          : null,
      );
    } catch (err: unknown) {
      setActionError((err as Error)?.message ?? 'Failed to certify');
    }
  };

  const handleUncertify = async (locationId: string) => {
    if (!detailUser) return;
    setActionError(null);
    try {
      await removeStaffFromLocation({
        variables: { locationId, staffId: detailUser.id },
      });
      setDetailUser((prev) =>
        prev
          ? {
              ...prev,
              certifiedLocations: prev.certifiedLocations.filter(
                (l) => l.id !== locationId,
              ),
            }
          : null,
      );
    } catch (err: unknown) {
      setActionError((err as Error)?.message ?? 'Failed to remove certification');
    }
  };

  const handleAssignSkill = async () => {
    if (!detailUser || !addSkillId) return;
    setActionError(null);
    try {
      await assignSkill({
        variables: { staffId: detailUser.id, skillId: addSkillId },
      });
      setAddSkillId('');
      setDetailUser((prev) =>
        prev
          ? {
              ...prev,
              skills: [
                ...prev.skills,
                skills.find((s) => s.id === addSkillId)!,
              ],
            }
          : null,
      );
    } catch (err: unknown) {
      setActionError((err as Error)?.message ?? 'Failed to assign skill');
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    if (!detailUser) return;
    setActionError(null);
    try {
      await removeSkill({
        variables: { staffId: detailUser.id, skillId },
      });
      setDetailUser((prev) =>
        prev
          ? {
              ...prev,
              skills: prev.skills.filter((s) => s.id !== skillId),
            }
          : null,
      );
    } catch (err: unknown) {
      setActionError((err as Error)?.message ?? 'Failed to remove skill');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) {
      setCreateError('Email and password are required.');
      return;
    }
    setCreateError(null);
    try {
      await registerUser({
        variables: {
          input: {
            email: newEmail.trim(),
            password: newPassword,
            name: newName.trim() || null,
            role: newRole,
          },
        },
      });
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      setNewRole(UserRole.Staff);
      setCreateOpen(false);
    } catch (err: unknown) {
      setCreateError((err as Error)?.message ?? 'Unable to create user.');
    }
  };

  if (!canAccess) {
    return (
      <p className="text-ps-error">
        Only admins and managers can access the People page.
      </p>
    );
  }

  if (staffLoading) return <p className="text-ps-fg-muted">Loading people…</p>;
  if (staffError) return <p className="text-ps-error">{staffError.message}</p>;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">People</h1>
        {user?.role === UserRole.Admin && (
          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setNewEmail('');
              setNewName('');
              setNewPassword('');
              setNewRole(UserRole.Staff);
              setCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-ps bg-ps-primary px-4 py-2 text-sm font-semibold text-ps-primary-foreground shadow-ps transition-colors hover:bg-ps-primary-hover"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            <span>Add person</span>
          </button>
        )}
      </div>
      <div className="mb-6 flex flex-col gap-3">
        <p className="max-w-2xl text-ps-sm text-ps-fg-muted">
          View and manage staff: certify them for locations and assign skills so
          they can be scheduled.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="w-full max-w-xs rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
            className="rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2 text-sm text-ps-fg outline-none focus:border-ps-border-focus"
          >
            <option value="">All roles</option>
            <option value={UserRole.Admin}>Admin</option>
            <option value={UserRole.Manager}>Manager</option>
            <option value={UserRole.Staff}>Staff</option>
          </select>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2 text-sm text-ps-fg outline-none focus:border-ps-border-focus"
          >
            <option value="">All locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2 text-sm text-ps-fg outline-none focus:border-ps-border-focus"
          >
            <option value="">All skills</option>
            {skills.map((sk) => (
              <option key={sk.id} value={sk.id}>
                {sk.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {staff.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-4 rounded-ps border border-ps-border bg-ps-bg-card p-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <div className="font-semibold">{s.name ?? s.email}</div>
                <span className="rounded-full bg-ps-surface-hover px-2 py-0.5 text-ps-xs text-ps-fg-muted">
                  {s.role}
                </span>
              </div>
              <div className="mt-1 text-ps-sm text-ps-fg-muted">{s.email}</div>
              <div className="mt-2 flex flex-wrap gap-2 text-ps-xs">
                {s.skills?.length > 0 && (
                  <span className="rounded bg-ps-primary-muted px-2 py-0.5 text-ps-primary">
                    {s.skills.map((sk) => sk.name).join(', ')}
                  </span>
                )}
                {s.certifiedLocations?.length > 0 && (
                  <span className="rounded bg-ps-surface-hover px-2 py-0.5 text-ps-fg-muted">
                    @ {s.certifiedLocations.map((l) => l.name).join(', ')}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => openDetail(s)}
              className="inline-flex items-center gap-1.5 rounded-ps border border-ps-border px-3 py-1.5 text-xs font-medium text-ps-fg transition-colors hover:bg-ps-surface-hover"
            >
              <EditIcon className="h-3.5 w-3.5" />
              Manage
            </button>
          </li>
        ))}
      </ul>
      {staff.length === 0 && (
        <p className="text-ps-fg-muted">
          No staff found. Adjust filters or add staff via registration.
        </p>
      )}

      {detailUser && (
        <Modal
          open
          onClose={() => setDetailUser(null)}
          title={`${detailUser.name ?? detailUser.email}`}
          maxWidth="lg"
          footer={
            <button
              type="button"
              onClick={() => setDetailUser(null)}
              className="text-ps-sm text-ps-fg-muted underline-offset-2 hover:underline"
            >
              Close
            </button>
          }
        >
          <div className="flex flex-col gap-6">
            <div>
              <div className="text-ps-sm font-medium text-ps-fg-muted">Email</div>
              <div className="text-ps-fg">{detailUser.email}</div>
            </div>

            <div>
              <div className="mb-2 text-ps-sm font-medium text-ps-fg-muted">
                Certified locations
              </div>
              <ul className="mb-3 list-inside list-disc text-ps-sm">
                {detailUser.certifiedLocations?.length === 0 ? (
                  <li className="text-ps-fg-muted">None</li>
                ) : (
                  detailUser.certifiedLocations?.map((l) => (
                    <li key={l.id} className="flex items-center gap-2">
                      {l.name}
                      <button
                        type="button"
                        onClick={() => handleUncertify(l.id)}
                        className="text-ps-error text-ps-xs hover:underline"
                      >
                        Remove
                      </button>
                    </li>
                  ))
                )}
              </ul>
              <div className="flex gap-2">
                <select
                  value={addLocationId}
                  onChange={(e) => setAddLocationId(e.target.value)}
                  className="rounded-ps border border-ps-border bg-ps-bg px-2 py-1.5 text-sm"
                >
                  <option value="">Add location…</option>
                  {locations
                    .filter(
                      (l) =>
                        !detailUser.certifiedLocations?.some((c) => c.id === l.id),
                    )
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleCertify}
                  disabled={!addLocationId}
                  className="rounded-ps bg-ps-primary px-3 py-1.5 text-sm font-medium text-ps-primary-foreground disabled:opacity-50"
                >
                  Certify
                </button>
              </div>
            </div>

            <div>
              <div className="mb-2 text-ps-sm font-medium text-ps-fg-muted">
                Skills
              </div>
              <ul className="mb-3 list-inside list-disc text-ps-sm">
                {detailUser.skills?.length === 0 ? (
                  <li className="text-ps-fg-muted">None</li>
                ) : (
                  detailUser.skills?.map((sk) => (
                    <li key={sk.id} className="flex items-center gap-2">
                      {sk.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(sk.id)}
                        className="text-ps-error text-ps-xs hover:underline"
                      >
                        Remove
                      </button>
                    </li>
                  ))
                )}
              </ul>
              <div className="flex gap-2">
                <select
                  value={addSkillId}
                  onChange={(e) => setAddSkillId(e.target.value)}
                  className="rounded-ps border border-ps-border bg-ps-bg px-2 py-1.5 text-sm"
                >
                  <option value="">Add skill…</option>
                  {skills
                    .filter(
                      (s) => !detailUser.skills?.some((sk) => sk.id === s.id),
                    )
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleAssignSkill}
                  disabled={!addSkillId}
                  className="rounded-ps bg-ps-primary px-3 py-1.5 text-sm font-medium text-ps-primary-foreground disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
            </div>

            {actionError && (
              <p className="text-ps-sm text-ps-error">{actionError}</p>
            )}
          </div>
        </Modal>
      )}

      {createOpen && (
        <Modal
          open
          onClose={() => !registering && setCreateOpen(false)}
          title="Add person"
          maxWidth="md"
          footer={
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => !registering && setCreateOpen(false)}
                className="text-ps-sm text-ps-fg-muted underline-offset-2 hover:underline"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-user-form"
                disabled={registering}
                className="inline-flex items-center justify-center rounded-ps bg-ps-primary px-4 py-2 text-sm font-semibold text-ps-primary-foreground shadow-ps transition-colors hover:bg-ps-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {registering ? 'Creating…' : 'Create'}
              </button>
            </div>
          }
        >
          <form
            id="create-user-form"
            onSubmit={handleCreateUser}
            className="flex flex-col gap-3"
          >
            <div>
              <label htmlFor="new-user-email" className="mb-1.5 block text-sm font-medium">
                Email
              </label>
              <input
                id="new-user-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full rounded-ps border border-ps-border bg-ps-bg px-3 py-2.5 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
              />
            </div>
            <div>
              <label htmlFor="new-user-name" className="mb-1.5 block text-sm font-medium">
                Name (optional)
              </label>
              <input
                id="new-user-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-ps border border-ps-border bg-ps-bg px-3 py-2.5 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
              />
            </div>
            <div>
              <label htmlFor="new-user-password" className="mb-1.5 block text-sm font-medium">
                Temporary password
              </label>
              <input
                id="new-user-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-ps border border-ps-border bg-ps-bg px-3 py-2.5 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
              />
            </div>
            <div>
              <label htmlFor="new-user-role" className="mb-1.5 block text-sm font-medium">
                Role
              </label>
              <select
                id="new-user-role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full rounded-ps border border-ps-border bg-ps-bg px-3 py-2.5 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
              >
                <option value={UserRole.Staff}>Staff</option>
                <option value={UserRole.Manager}>Manager</option>
                <option value={UserRole.Admin}>Admin</option>
              </select>
            </div>
            {createError && (
              <p className="text-ps-sm text-ps-error">{createError}</p>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}
