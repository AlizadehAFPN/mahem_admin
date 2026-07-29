'use client';

import { useState, useTransition } from 'react';
import { imageWarnings, type ImageAdvice } from '@/lib/image-advice';

export type { ImageAdvice };

export interface EntityField {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'checkbox' | 'select' | 'textarea' | 'image' | 'hidden';
  options?: { value: string; label: string }[];
  required?: boolean;
  advice?: ImageAdvice;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

// Kept just under next.config.ts's serverActions.bodySizeLimit so an oversized
// image is caught here — with a message naming the file and its size — rather
// than by the platform, which rejects the whole request with an opaque 413
// after the upload has already been sent.
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function oversizedFileError(formData: FormData): string | null {
  for (const value of formData.values()) {
    if (value instanceof File && value.size > MAX_UPLOAD_BYTES) {
      const mb = (value.size / 1024 / 1024).toFixed(1);
      return `حجم فایل «${value.name}» ${mb} مگابایت است و از حد مجاز (۵ مگابایت) بیشتر است. لطفاً تصویر را فشرده یا کوچک‌تر کنید.`;
    }
  }
  return null;
}

// Resolves without width/height for anything the browser can't decode (a PDF
// renamed .jpg, a corrupt file) — the shape-based advice is then skipped
// rather than the whole check failing.
function inspectImage(file: File) {
  return new Promise<Parameters<typeof imageWarnings>[0]>(resolve => {
    const base = { byteSize: file.size, mimeType: file.type };
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ ...base, width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(base);
    };
    img.src = url;
  });
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
  // Per image field, so a form with more than one doesn't mix them up.
  const [warnings, setWarnings] = useState<Record<string, string[]>>({});

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
                const tooBig = oversizedFileError(formData);
                if (tooBig) {
                  setError(tooBig);
                  return;
                }
                startTransition(async () => {
                  // A Server Action that *throws* (rather than returning an
                  // unsuccessful ActionResult) escapes the transition and
                  // trips the nearest error boundary, replacing this whole
                  // page with the generic failure screen — the modal, the
                  // form and everything typed into it gone. Kept local
                  // instead: the form stays open, with the reason on it.
                  try {
                    const result = await action(formData);
                    if (result.success) {
                      setOpen(false);
                    } else {
                      setError(result.error ?? 'خطایی رخ داد.');
                    }
                  } catch {
                    setError(
                      'ارسال به سرور ناموفق بود. اگر فایل بزرگی انتخاب کرده‌اید آن را کوچک‌تر کنید، در غیر این صورت چند لحظه بعد دوباره تلاش کنید.',
                    );
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
                        onChange={async event => {
                          const file = event.target.files?.[0];
                          const advice = field.advice;
                          if (!file || !advice) {
                            setWarnings(prev => ({ ...prev, [field.name]: [] }));
                            return;
                          }
                          const found = imageWarnings(await inspectImage(file), advice);
                          setWarnings(prev => ({ ...prev, [field.name]: found }));
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                      {/* Advisory only — the submit button stays enabled and
                          nothing here is re-checked on submit. An admin who
                          has looked at the photo and wants it anyway should
                          not have to fight the form. */}
                      {warnings[field.name]?.length > 0 && (
                        <div className="mt-2 rounded-lg bg-amber-50 p-3 ring-1 ring-amber-200">
                          <p className="mb-1 text-xs font-medium text-amber-800">
                            ⚠️ این تصویر ایده‌آل نیست (می‌توانید با همین ادامه دهید):
                          </p>
                          <ul className="list-inside list-disc space-y-1">
                            {warnings[field.name].map(warning => (
                              <li key={warning} className="text-xs leading-5 text-amber-700">
                                {warning}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
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
