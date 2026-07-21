'use client';

import { useState, useTransition } from 'react';

export interface EntityField {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'checkbox' | 'select' | 'textarea' | 'image' | 'hidden';
  options?: { value: string; label: string }[];
  required?: boolean;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

export function EntityModal({
  triggerLabel,
  triggerClassName,
  title,
  fields,
  initialValues,
  action,
}: {
  triggerLabel: string;
  triggerClassName?: string;
  title: string;
  fields: EntityField[];
  initialValues?: Record<string, string | number | boolean | null | undefined>;
  action: (formData: FormData) => Promise<ActionResult>;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          triggerClassName ??
          'rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50'
        }
      >
        {triggerLabel}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <form
              action={formData => {
                setError(null);
                startTransition(async () => {
                  const result = await action(formData);
                  if (result.success) {
                    setOpen(false);
                  } else {
                    setError(result.error ?? 'خطایی رخ داد.');
                  }
                });
              }}
              className="mt-4 space-y-3"
            >
              {fields.map(field => {
                const initial = initialValues?.[field.name];
                if (field.type === 'hidden') {
                  return (
                    <input
                      key={field.name}
                      type="hidden"
                      name={field.name}
                      defaultValue={initial === undefined || initial === null ? '' : String(initial)}
                    />
                  );
                }
                if (field.type === 'image') {
                  const previewUrl = initialValues?.[`${field.name}PreviewUrl`];
                  return (
                    <div key={field.name}>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        {field.label}
                      </label>
                      {typeof previewUrl === 'string' && previewUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl}
                          alt=""
                          className="mb-2 h-24 w-full rounded-lg object-cover ring-1 ring-gray-200"
                        />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        name={field.name}
                        required={field.required && !previewUrl}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                  );
                }
                if (field.type === 'checkbox') {
                  return (
                    <label key={field.name} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        name={field.name}
                        defaultChecked={Boolean(initial)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      {field.label}
                    </label>
                  );
                }
                if (field.type === 'select') {
                  return (
                    <div key={field.name}>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        {field.label}
                      </label>
                      <select
                        name={field.name}
                        defaultValue={initial === undefined || initial === null ? '' : String(initial)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      >
                        {field.options?.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }
                if (field.type === 'textarea') {
                  return (
                    <div key={field.name}>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        {field.label}
                      </label>
                      <textarea
                        name={field.name}
                        defaultValue={initial === undefined || initial === null ? '' : String(initial)}
                        required={field.required}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                  );
                }
                return (
                  <div key={field.name}>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      {field.label}
                    </label>
                    <input
                      type={field.type ?? 'text'}
                      name={field.name}
                      defaultValue={initial === undefined || initial === null ? '' : String(initial)}
                      required={field.required}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                );
              })}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
                >
                  {isPending ? 'در حال ذخیره…' : 'ذخیره'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
