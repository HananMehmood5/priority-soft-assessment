'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import type { SkillAttributes, UserRole } from '@shiftsync/shared';
import Link from 'next/link';
import {
  SKILLS_QUERY,
  CREATE_SKILL_MUTATION,
  UPDATE_SKILL_MUTATION,
  DELETE_SKILL_MUTATION,
} from '@/lib/apollo/operations';
import { EditIcon } from '@/src/components/icons/EditIcon';
import { TrashIcon } from '@/src/components/icons/TrashIcon';
import { PlusIcon } from '@/src/components/icons/PlusIcon';
import { Modal } from '@/src/components/Modal';
import { PageHeader } from '@/libs/ui/PageHeader';
import { ErrorState } from '@/libs/ui/ErrorState';
import { PageSkeleton } from '@/libs/ui/PageSkeleton';
import { Button } from '@/libs/ui/Button';
import { Input } from '@/libs/ui/Input';

const SKILLS_DESCRIPTION =
  'Skills represent the roles staff can work (e.g. bartender, line cook, server) and are used to match staff to shift requirements.';

type EditState = { id: string; name: string } | null;

export default function SkillsPage() {
  const { token, user } = useAuth();
  const isAdmin = useMemo(() => user?.role === ('Admin' as UserRole), [user]);

  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [skillToDelete, setSkillToDelete] = useState<SkillAttributes | null>(null);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery<{ skills: SkillAttributes[] }>(
    SKILLS_QUERY,
    {
      skip: !token,
    },
  );
  const allSkills = data?.skills ?? [];
  const skills = allSkills.filter((skill) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return skill.name.toLowerCase().includes(q);
  });

  const [createSkill, { loading: creating }] = useMutation(CREATE_SKILL_MUTATION, {
    refetchQueries: [{ query: SKILLS_QUERY }],
  });
  const [updateSkill, { loading: updating }] = useMutation(UPDATE_SKILL_MUTATION, {
    refetchQueries: [{ query: SKILLS_QUERY }],
  });
  const [deleteSkill, { loading: deleting }] = useMutation(DELETE_SKILL_MUTATION, {
    refetchQueries: [{ query: SKILLS_QUERY }],
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setCreateError('Skill name is required.');
      return;
    }
    setCreateError(null);
    try {
      await createSkill({
        variables: { input: { name: newName.trim() } },
      });
      setNewName('');
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Unable to create skill.');
    }
  };

  const startEdit = (skill: SkillAttributes) => {
    setEditState({ id: skill.id, name: skill.name });
    setEditError(null);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editState) return;
    if (!editState.name.trim()) {
      setEditError('Skill name is required.');
      return;
    }
    setEditError(null);
    try {
      await updateSkill({
        variables: { id: editState.id, input: { name: editState.name.trim() } },
      });
      setEditState(null);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Unable to update skill.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!skillToDelete) return;
    try {
      await deleteSkill({ variables: { id: skillToDelete.id } });
    } finally {
      setSkillToDelete(null);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Skills" description={SKILLS_DESCRIPTION} />
        <PageSkeleton lines={5} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <PageHeader title="Skills" description={SKILLS_DESCRIPTION} />
        <ErrorState message={error.message} onRetry={() => refetch()} variant="card" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Skills"
        description={SKILLS_DESCRIPTION}
        action={
          isAdmin ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setCreateError(null);
                setNewName('');
                setCreateOpen(true);
              }}
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Add skill</span>
            </Button>
          ) : undefined
        }
      />
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex justify-end">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills"
            className="w-full max-w-xs"
            aria-label="Search skills"
          />
        </div>
      </div>
      {!isAdmin && (
        <p className="mb-3 text-ps-sm text-ps-fg-muted">
          Skills are centrally managed by admins and used to match staff to shift requirements.
        </p>
      )}
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {skills.map((skill) => {
          const isEditing = editState?.id === skill.id;
          return (
            <li
              key={skill.id}
              className="flex items-center justify-between gap-4 rounded-ps border border-ps-border bg-ps-bg-card p-4"
            >
              <div className="flex-1">
                {isEditing ? (
                  <form
                    id={`edit-skill-form-${skill.id}`}
                    onSubmit={handleEditSave}
                    className="flex flex-col gap-2"
                  >
                    <Input
                      value={editState.name}
                      onChange={(e) =>
                        setEditState((prev) =>
                          prev ? { ...prev, name: e.target.value } : prev
                        )
                      }
                      error={editError}
                      aria-label="Skill name"
                    />
                  </form>
                ) : (
                  <Link
                    href={`/people?skillId=${encodeURIComponent(skill.id)}`}
                    className="font-semibold hover:underline"
                  >
                    {skill.name}{' '}
                    <span className="text-ps-xs font-normal text-ps-fg-muted">
                      — {skill.staffCount ?? 0} staff
                    </span>
                  </Link>
                )}
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        type="submit"
                        form={`edit-skill-form-${skill.id}`}
                        variant="primary"
                        size="sm"
                        disabled={updating}
                        loading={updating}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditState(null)}
                        className="font-normal text-ps-xs text-ps-fg-muted underline-offset-2 hover:underline"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => startEdit(skill)}
                        className="gap-1.5"
                      >
                        <EditIcon className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setSkillToDelete(skill)}
                        disabled={deleting}
                        className="gap-1.5"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </Button>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {skills.length === 0 && <p className="text-ps-fg-muted">No skills.</p>}

      {isAdmin && createOpen && (
        <Modal
          open={createOpen}
          onClose={() => {
            if (!creating) {
              setCreateOpen(false);
            }
          }}
          title="Add skill"
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => !creating && setCreateOpen(false)}
                className="font-normal text-ps-sm text-ps-fg-muted underline-offset-2 hover:underline"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="create-skill-form"
                variant="primary"
                disabled={creating}
                loading={creating}
              >
                Create
              </Button>
            </div>
          }
        >
          <form id="create-skill-form" onSubmit={handleCreate} className="flex flex-col gap-3">
            <Input
              id="new-skill-name"
              label="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Bartender"
            />
            {createError && <p className="text-ps-sm text-ps-error">{createError}</p>}
          </form>
        </Modal>
      )}

      {isAdmin && skillToDelete && (
        <Modal
          open
          onClose={() => setSkillToDelete(null)}
          title="Delete skill"
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSkillToDelete(null)}
                className="font-normal text-ps-sm text-ps-fg-muted underline-offset-2 hover:underline"
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
            Delete skill “{skillToDelete.name}”? This action cannot be undone and may affect existing
            staff assignments and shifts (currently applied to {skillToDelete.staffCount ?? 0} staff).
          </p>
        </Modal>
      )}
    </div>
  );
}
