'use client';

import { useState, useTransition } from 'react';

export function SetExpiryButton({
  action,
  currentExpiresAt,
}: {
  action: (formData: FormData) => Promise<void>;
  currentExpiresAt: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
      >
        تغییر تاریخ انقضا
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">تاریخ انقضای جدید</h3>
            <form
              action={formData => {
                startTransition(async () => {
                  await action(formData);
                  setOpen(false);
                });
              }}
              className="mt-4 space-y-4"
            >
              <input
                type="date"
                name="expiresAt"
                required
                defaultValue={currentExpiresAt?.slice(0, 10)}
                autoFocus
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-gray-900 focus:outline-none"
                dir="ltr"
              />
              <p className="text-xs text-gray-500">
                در صورت انتخاب تاریخ، آگهی (در صورت آرشیو بودن) دوباره فعال می‌شود.
              </p>
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
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
                >
                  {isPending ? 'در حال ثبت…' : 'ثبت'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
