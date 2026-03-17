'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import type { SkillAttributes, UserRole } from '@shiftsync/shared';
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

  const { data, loading, error } = useQuery<{ skills: SkillAttributes[] }>(SKILLS_QUERY, {
    skip: !token,
  });
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
    } catch (err: any) {
      setCreateError(err?.message ?? 'Unable to create skill.');
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
    } catch (err: any) {
      setEditError(err?.message ?? 'Unable to update skill.');
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

  if (loading) return <p className="text-ps-fg-muted">Loading skills…</p>;
  if (error) return <p className="text-ps-error">{error.message}</p>;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Skills</h1>
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setNewName('');
              setCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-ps bg-ps-primary px-4 py-2 text-sm font-semibold text-ps-primary-foreground shadow-ps transition-colors hover:bg-ps-primary-hover"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            <span>Add skill</span>
          </button>
        )}
      </div>
      <div className="mb-6 flex flex-col gap-3">
        <p className="max-w-2xl text-ps-sm text-ps-fg-muted">
          Skills represent the roles staff can work (e.g. bartender, line cook, server) and are used
          to match staff to shift requirements.
        </p>
        <div className="flex justify-end">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills"
            className="w-full max-w-xs rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
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
                  <form onSubmit={handleEditSave} className="flex flex-col gap-2">
                    <input
                      value={editState.name}
                      onChange={(e) =>
                        setEditState((prev) =>
                          prev ? { ...prev, name: e.target.value } : prev
                        )
                      }
                      className="w-full rounded-ps border border-ps-border bg-ps-bg px-3 py-2 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
                    />
                    {editError && (
                      <p className="text-ps-xs text-ps-error">{editError}</p>
                    )}
                  </form>
                ) : (
                  <div className="font-semibold">{skill.name}</div>
                )}
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleEditSave}
                        disabled={updating}
                        className="rounded-ps bg-ps-primary px-3 py-1.5 text-xs font-semibold text-ps-primary-foreground shadow-ps transition-colors hover:bg-ps-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditState(null)}
                        className="text-ps-xs text-ps-fg-muted underline-offset-2 hover:underline"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(skill)}
                        className="inline-flex items-center gap-1.5 rounded-ps border border-ps-border px-3 py-1.5 text-xs font-medium text-ps-fg transition-colors hover:bg-ps-surface-hover"
                      >
                        <EditIcon className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSkillToDelete(skill)}
                        disabled={deleting}
                        className="inline-flex items-center gap-1.5 rounded-ps border border-ps-error px-3 py-1.5 text-xs font-medium text-ps-error transition-colors hover:bg-ps-error/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
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
              <button
                type="button"
                onClick={() => !creating && setCreateOpen(false)}
                className="text-ps-sm text-ps-fg-muted underline-offset-2 hover:underline"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-skill-form"
                disabled={creating}
                className="inline-flex items-center justify-center rounded-ps bg-ps-primary px-4 py-2 text-sm font-semibold text-ps-primary-foreground shadow-ps transition-colors hover:bg-ps-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                Create
              </button>
            </div>
          }
        >
          <form id="create-skill-form" onSubmit={handleCreate} className="flex flex-col gap-3">
            <div>
              <label htmlFor="new-skill-name" className="mb-1.5 block text-sm font-medium">
                Name
              </label>
              <input
                id="new-skill-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Bartender"
                className="w-full rounded-ps border border-ps-border bg-ps-bg px-3 py-2 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
              />
            </div>
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
              <button
                type="button"
                onClick={() => setSkillToDelete(null)}
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
            Delete skill “{skillToDelete.name}”? This action cannot be undone and may affect
            existing staff assignments and shifts.
          </p>
        </Modal>
      )}
    </div>
  );
}
