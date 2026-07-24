'use client';

import { useTransition } from 'react';

export function ArchiveButton({
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
      className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
    >
      {isPending ? 'در حال آرشیو…' : 'آرشیو کردن'}
    </button>
  );
}
