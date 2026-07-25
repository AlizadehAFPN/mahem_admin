'use client';

import { useRef, useState, useTransition } from 'react';
import type { AdminEditableEntity } from '@/lib/admin-edit-actions';
import { updateAdminEntityAction, uploadEntityImageAction } from '@/lib/admin-edit-actions';
import { proxiedImageUrl } from '@/lib/image';

// Single-image field editor (Store logo/banner, Job banner/logo) — an inline
// variant of the upload-then-PATCH flow banners/splash-screens already use
// (see mahem-admin/src/app/dashboard/banners/actions.ts resolveImageUrl),
// minus the wrapping EntityModal since this edits one field of an
// already-open detail page rather than creating/replacing a whole entity.
export function SingleImageEditor({
  entityPath,
  id,
  fieldName,
  label,
  url,
  canEdit,
  className,
}: {
  entityPath: AdminEditableEntity;
  id: string;
  fieldName: string;
  label: string;
  url: string | null;
  canEdit: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    startTransition(async () => {
      const uploaded = await uploadEntityImageAction(formData);
      if ('error' in uploaded) {
        setError(uploaded.error);
        return;
      }
      const result = await updateAdminEntityAction(entityPath, id, { [fieldName]: uploaded.url });
      if (!result.success) {
        setError(result.error ?? 'خطایی رخ داد.');
      }
    });
  };

  return (
    <div className={className}>
      <div className="relative inline-block">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={proxiedImageUrl(url)}
            alt={label}
            className="h-40 w-40 rounded-xl object-cover ring-1 ring-gray-200"
          />
        ) : (
          <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-400 ring-1 ring-gray-200">
            بدون تصویر
          </div>
        )}
        {canEdit && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
            className="absolute bottom-1 left-1 rounded-full bg-white/90 p-1.5 text-sm shadow ring-1 ring-gray-300 hover:bg-white"
            aria-label={`تغییر ${label}`}
          >
            {isPending ? '…' : '✏️'}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
