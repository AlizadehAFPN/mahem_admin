'use client';

import { useState, useTransition } from 'react';
import type { Role } from '@/lib/types';
import type { UpdateRoleResult } from '@/app/dashboard/users/actions';

const roleLabels: Record<Role, string> = {
  USER: 'کاربر',
  ADMIN: 'ادمین',
  SUPER_ADMIN: 'سوپر ادمین',
};

export function RoleSelect({
  currentRole,
  action,
}: {
  currentRole: Role;
  action: (formData: FormData) => Promise<UpdateRoleResult>;
}) {
  const [role, setRole] = useState<Role>(currentRole);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set('role', role);
    startTransition(async () => {
      const result = await action(formData);
      if (!result.success) {
        setError(result.error ?? 'خطا در تغییر نقش');
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <select
        value={role}
        onChange={e => setRole(e.target.value as Role)}
        className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
      >
        {(['USER', 'ADMIN', 'SUPER_ADMIN'] as Role[]).map(r => (
          <option key={r} value={r}>
            {roleLabels[r]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending || role === currentRole}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
      >
        {isPending ? 'در حال ذخیره…' : 'ذخیره'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
