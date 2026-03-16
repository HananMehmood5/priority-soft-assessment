'use client';

import { useQuery } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import type { SkillAttributes } from '@shiftsync/shared';
import { SKILLS_QUERY } from '@/lib/apollo/operations';

export default function SkillsPage() {
  const { token } = useAuth();
  const { data, loading, error } = useQuery<{ skills: SkillAttributes[] }>(
    SKILLS_QUERY,
    { skip: !token }
  );
  const skills = data?.skills ?? [];

  if (loading) return <p className="text-ps-fg-muted">Loading skills…</p>;
  if (error) return <p className="text-ps-error">{error.message}</p>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Skills</h1>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {skills.map((skill) => (
          <li
            key={skill.id}
            className="rounded-ps border border-ps-border bg-ps-bg-card p-4"
          >
            <div className="font-semibold">{skill.name}</div>
          </li>
        ))}
      </ul>
      {skills.length === 0 && <p className="text-ps-fg-muted">No skills.</p>}
    </div>
  );
}
