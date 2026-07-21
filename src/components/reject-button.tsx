'use client';

import { useState, useTransition } from 'react';

export function RejectButton({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50"
      >
        رد کردن
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">دلیل رد شدن</h3>
            <form
              action={formData => {
                startTransition(async () => {
                  await action(formData);
                  setOpen(false);
                });
              }}
              className="mt-4 space-y-4"
            >
              <textarea
                name="reason"
                required
                minLength={3}
                rows={3}
                autoFocus
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-gray-900 focus:outline-none"
                placeholder="مثلاً: تصاویر نامرتبط با آگهی است"
              />
              <div className="flex justify-end gap-2">
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
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {isPending ? 'در حال ثبت…' : 'رد کردن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
