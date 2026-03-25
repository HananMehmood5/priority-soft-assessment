'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@shiftsync/shared';
import { useCanAccessManagerNav, useIsAdmin } from '@/lib/hooks/use-role';
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
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/libs/ui/PageHeader';
import { ErrorState } from '@/libs/ui/ErrorState';
import { PageSkeleton } from '@/libs/ui/PageSkeleton';
import { Button } from '@/libs/ui/Button';
import { Card } from '@/libs/ui/Card';
import { Input } from '@/libs/ui/Input';
import { Select } from '@/libs/ui/Select';

const PEOPLE_DESCRIPTION =
  'View and manage staff: certify them for locations and assign skills so they can be scheduled.';

type StaffMember = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  skills: Array<{ id: string; name: string }>;
  certifiedLocations: Array<{ id: string; name: string }>;
};

export default function PeoplePage() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState(() => searchParams.get('skillId') ?? '');
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

  const canAccess = useCanAccessManagerNav();
  const isAdmin = useIsAdmin();

  useEffect(() => {
    const skillId = searchParams.get('skillId');
    setSkillFilter(skillId ?? '');
  }, [searchParams]);

  const {
    data: staffData,
    loading: staffLoading,
    error: staffError,
    refetch: refetchStaff,
  } = useQuery<{
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

  const locations = locationsData?.locations ?? [];
  const skills = skillsData?.skills ?? [];

  const staff = useMemo(() => {
    const allStaff = staffData?.staff ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return allStaff;
    return allStaff.filter(
      (s) =>
        (s.name?.toLowerCase().includes(q) ?? false) ||
        s.email.toLowerCase().includes(q),
    );
  }, [staffData?.staff, search]);

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

  if (staffLoading) {
    return (
      <div>
        <PageHeader title="People" description={PEOPLE_DESCRIPTION} />
        <PageSkeleton lines={6} />
      </div>
    );
  }
  if (staffError) {
    return (
      <div>
        <PageHeader title="People" description={PEOPLE_DESCRIPTION} />
        <ErrorState
          message={staffError.message}
          onRetry={() => refetchStaff()}
          variant="card"
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="People"
        description={PEOPLE_DESCRIPTION}
        action={
          isAdmin ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setCreateError(null);
                setNewEmail('');
                setNewName('');
                setNewPassword('');
                setNewRole(UserRole.Staff);
                setCreateOpen(true);
              }}
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Add person</span>
            </Button>
          ) : undefined
        }
      />
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="w-full max-w-xs"
            aria-label="Search staff by name or email"
          />
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
            className="w-auto min-w-[10rem]"
            aria-label="Filter by role"
          >
            <option value="">All roles</option>
            <option value={UserRole.Admin}>Admin</option>
            <option value={UserRole.Manager}>Manager</option>
            <option value={UserRole.Staff}>Staff</option>
          </Select>
          <Select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-auto min-w-[10rem]"
            aria-label="Filter by location"
          >
            <option value="">All locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </Select>
          <Select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="w-auto min-w-[10rem]"
            aria-label="Filter by skill"
          >
            <option value="">All skills</option>
            {skills.map((sk) => (
              <option key={sk.id} value={sk.id}>
                {sk.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {staff.map((s) => (
          <li key={s.id}>
            <Card className="flex items-center justify-between gap-4">
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
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => openDetail(s)}
              className="gap-1.5"
            >
              <EditIcon className="h-3.5 w-3.5" />
              Manage
            </Button>
            </Card>
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
            <Button
              type="button"
              variant="ghostLink"
              onClick={() => setDetailUser(null)}
            >
              Close
            </Button>
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUncertify(l.id)}
                        className="min-h-0 px-0 py-0 text-ps-xs font-normal text-ps-error hover:bg-transparent hover:underline"
                      >
                        Remove
                      </Button>
                    </li>
                  ))
                )}
              </ul>
              <div className="flex gap-2">
                <Select
                  value={addLocationId}
                  onChange={(e) => setAddLocationId(e.target.value)}
                  className="min-w-0 flex-1"
                  aria-label="Location to certify"
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
                </Select>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleCertify}
                  disabled={!addLocationId}
                >
                  Certify
                </Button>
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSkill(sk.id)}
                        className="min-h-0 px-0 py-0 text-ps-xs font-normal text-ps-error hover:bg-transparent hover:underline"
                      >
                        Remove
                      </Button>
                    </li>
                  ))
                )}
              </ul>
              <div className="flex gap-2">
                <Select
                  value={addSkillId}
                  onChange={(e) => setAddSkillId(e.target.value)}
                  className="min-w-0 flex-1"
                  aria-label="Skill to assign"
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
                </Select>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAssignSkill}
                  disabled={!addSkillId}
                >
                  Assign
                </Button>
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
              <Button
                type="button"
                variant="ghostLink"
                onClick={() => !registering && setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="create-user-form"
                variant="primary"
                disabled={registering}
                loading={registering}
                loadingLabel="Creating…"
              >
                Create
              </Button>
            </div>
          }
        >
          <form
            id="create-user-form"
            onSubmit={handleCreateUser}
            className="flex flex-col gap-3"
          >
            <Input
              id="new-user-email"
              label="Email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <Input
              id="new-user-name"
              label="Name (optional)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              id="new-user-password"
              label="Temporary password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Select
              id="new-user-role"
              label="Role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
            >
              <option value={UserRole.Staff}>Staff</option>
              <option value={UserRole.Manager}>Manager</option>
              <option value={UserRole.Admin}>Admin</option>
            </Select>
            {createError && (
              <p className="text-ps-sm text-ps-error">{createError}</p>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}
