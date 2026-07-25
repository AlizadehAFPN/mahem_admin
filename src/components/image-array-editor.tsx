'use client';

import { useRef, useState, useTransition } from 'react';
import type { AdminEditableEntity } from '@/lib/admin-edit-actions';
import { updateAdminEntityAction, uploadEntityImageAction } from '@/lib/admin-edit-actions';
import { proxiedImageUrl } from '@/lib/image';

// Multi-image gallery editor (Advertisement.images / Store.images) — each
// thumbnail gets a hover overlay with replace/remove icons, plus a trailing
// "add image" tile. No array-upload UI existed anywhere in this admin panel
// before (only single-image fields like banners) — this is the new piece.
export function ImageArrayEditor({
  entityPath,
  id,
  fieldName,
  images,
  canEdit,
}: {
  entityPath: AdminEditableEntity;
  id: string;
  fieldName: string;
  images: string[];
  canEdit: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);

  const saveImages = (next: string[]) => {
    startTransition(async () => {
      const result = await updateAdminEntityAction(entityPath, id, { [fieldName]: next });
      if (!result.success) {
        setError(result.error ?? 'خطایی رخ داد.');
      }
    });
  };

  const onReplaceClick = (index: number) => {
    replaceIndexRef.current = index;
    replaceInputRef.current?.click();
  };

  const onReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const index = replaceIndexRef.current;
    e.target.value = '';
    if (!file || index === null) return;
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    startTransition(async () => {
      const uploaded = await uploadEntityImageAction(formData);
      if ('error' in uploaded) {
        setError(uploaded.error);
        return;
      }
      const next = [...images];
      next[index] = uploaded.url;
      const result = await updateAdminEntityAction(entityPath, id, { [fieldName]: next });
      if (!result.success) {
        setError(result.error ?? 'خطایی رخ داد.');
      }
    });
  };

  const onAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const next = [...images, uploaded.url];
      const result = await updateAdminEntityAction(entityPath, id, { [fieldName]: next });
      if (!result.success) {
        setError(result.error ?? 'خطایی رخ داد.');
      }
    });
  };

  const onRemove = (index: number) => {
    saveImages(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="group relative h-40 w-full overflow-hidden rounded-xl ring-1 ring-gray-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={proxiedImageUrl(url)} alt="" className="h-full w-full object-cover" />
            {canEdit && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onReplaceClick(index)}
                  disabled={isPending}
                  className="rounded-full bg-white/90 p-1.5 text-sm shadow hover:bg-white"
                  aria-label="جایگزینی تصویر"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  disabled={isPending}
                  className="rounded-full bg-white/90 p-1.5 text-sm shadow hover:bg-white"
                  aria-label="حذف تصویر"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        ))}
        {canEdit && (
          <button
            type="button"
            onClick={() => addInputRef.current?.click()}
            disabled={isPending}
            className="flex h-40 w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-400 transition hover:border-gray-400 hover:text-gray-600"
          >
            {isPending ? '…' : '+ افزودن عکس'}
          </button>
        )}
      </div>
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onReplaceFile}
      />
      <input ref={addInputRef} type="file" accept="image/*" className="hidden" onChange={onAddFile} />
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
