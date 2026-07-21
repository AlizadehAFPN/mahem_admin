'use client';

import { useTransition } from 'react';

export function DeleteButton({
  action,
  confirmText,
}: {
  action: () => Promise<void>;
  confirmText: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (window.confirm(confirmText)) {
          startTransition(action);
        }
      }}
      disabled={isPending}
      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50 disabled:opacity-40"
    >
      {isPending ? 'در حال حذف…' : 'حذف'}
    </button>
  );
}
