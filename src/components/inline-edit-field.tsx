'use client';

import { useState, useTransition } from 'react';
import type { AdminEditableEntity } from '@/lib/admin-edit-actions';
import { updateAdminEntityAction } from '@/lib/admin-edit-actions';

type FieldType = 'text' | 'number' | 'textarea' | 'select';

// Renders a <dt>/<dd> row matching the existing `<dl className="space-y-2
// text-sm">` info-panel pattern (see advertisements/[id]/page.tsx,
// jobs/[id]/page.tsx) — drop-in replacement for a static row. Only
// SUPER_ADMIN (canEdit) sees the pencil icon; clicking it turns the value
// into an input/textarea/select in place, with save/cancel controls.
export function InlineEditField({
  entityPath,
  id,
  fieldName,
  label,
  value,
  type = 'text',
  options,
  canEdit,
  displayValue,
  parseAsBoolean,
  dir,
  variant = 'row',
  attributesBase,
}: {
  entityPath: AdminEditableEntity;
  id: string;
  fieldName: string;
  label: string;
  value: string | number | null;
  type?: FieldType;
  options?: { value: string; label: string }[];
  canEdit: boolean;
  displayValue?: React.ReactNode;
  // The field's underlying value is a boolean (rendered as a بله/خیر
  // `select`) — draft strings parse back to `true`/`false` instead of
  // staying a string. A plain flag rather than a parser function: this is a
  // Client Component, and callers are Server Components (the page fetching
  // the entity), which can only pass serializable props across that
  // boundary — not closures.
  parseAsBoolean?: boolean;
  dir?: 'ltr' | 'rtl';
  // 'row' fits the existing `<dl className="space-y-2 text-sm">` info-panel
  // pattern; 'heading' is for a page's <h1>-sized title field, which lives
  // outside any dl and needs larger text instead of a label/value row;
  // 'block' is for a standalone paragraph (e.g. description) — owns its own
  // display text instead of a caller-rendered <p>, so there's no duplicate.
  variant?: 'row' | 'heading' | 'block';
  // For a field nested inside a JSON blob (e.g. a single key of
  // Advertisement.attributes) rather than its own column: the entity's
  // current attributes object, so the PATCH body can merge the edited key
  // into it (`{ attributes: { ...attributesBase, [fieldName]: parsed } }`)
  // instead of the default `{ [fieldName]: parsed }`.
  attributesBase?: Record<string, unknown> | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value === null || value === undefined ? '' : String(value));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSave = () => {
    setError(null);
    const parsed = parseAsBoolean
      ? draft === 'true'
      : type === 'number'
        ? (draft === '' ? null : Number(draft))
        : draft;
    const payload =
      attributesBase !== undefined
        ? { attributes: { ...attributesBase, [fieldName]: parsed } }
        : { [fieldName]: parsed };
    startTransition(async () => {
      const result = await updateAdminEntityAction(entityPath, id, payload);
      if (result.success) {
        setEditing(false);
      } else {
        setError(result.error ?? 'خطایی رخ داد.');
      }
    });
  };

  const onCancel = () => {
    setDraft(value === null || value === undefined ? '' : String(value));
    setError(null);
    setEditing(false);
  };

  if (!editing) {
    if (variant === 'heading') {
      return (
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900" dir={dir}>
            {value}
          </h1>
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-gray-400 transition hover:text-gray-700"
              aria-label={`ویرایش ${label}`}
            >
              ✏️
            </button>
          )}
        </div>
      );
    }
    if (variant === 'block') {
      return (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-500">{label}</h2>
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-gray-400 transition hover:text-gray-700"
                aria-label={`ویرایش ${label}`}
              >
                ✏️
              </button>
            )}
          </div>
          <p className="whitespace-pre-wrap text-sm text-gray-800" dir={dir}>
            {value}
          </p>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 py-1.5 text-sm">
        <dt className="text-gray-500">{label}</dt>
        <div className="flex items-center gap-2">
          <dd className="font-medium text-gray-900" dir={dir}>
            {displayValue ?? (value === null || value === undefined || value === '' ? '—' : value)}
          </dd>
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-gray-400 transition hover:text-gray-700"
              aria-label={`ویرایش ${label}`}
            >
              ✏️
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'block') {
    return (
      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">{label}</h2>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={5}
          dir={dir}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        <div className="mt-1 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isPending}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            {isPending ? 'در حال ذخیره…' : 'ذخیره'}
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'heading') {
    return (
      <div className="max-w-lg">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          dir={dir}
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xl font-bold text-gray-900"
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        <div className="mt-1 flex gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={isPending}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            {isPending ? 'در حال ذخیره…' : 'ذخیره'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            انصراف
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-100 py-1.5 text-sm">
      <dt className="mb-1 text-gray-500">{label}</dt>
      {type === 'select' ? (
        <select
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
        >
          {options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={3}
          dir={dir}
          className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
        />
      ) : (
        <input
          type={type === 'number' ? 'number' : 'text'}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          dir={dir}
          className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
        />
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <div className="mt-1 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          انصراف
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          {isPending ? 'در حال ذخیره…' : 'ذخیره'}
        </button>
      </div>
    </div>
  );
}
