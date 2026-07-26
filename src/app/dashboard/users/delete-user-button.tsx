'use client';

import { useState, useTransition } from 'react';
import { deleteUserAction } from './actions';

// Full, irreversible deletion of a user and all their data. To prevent an
// accidental click, the admin must type the user's mobile number exactly
// before the confirm button enables.
export function DeleteUserButton({
  userId,
  userMobile,
  userLabel,
}: {
  userId: string;
  userMobile: string;
  userLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const close = () => {
    setOpen(false);
    setTyped('');
    setError(null);
  };

  const onConfirm = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteUserAction(userId);
      if (res.success) {
        close();
      } else {
        setError(res.error ?? 'حذف کاربر با خطا مواجه شد.');
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50"
      >
        حذف کامل
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-red-700">حذف کامل کاربر</h3>
            <div className="mt-3 space-y-2 text-sm text-gray-600">
              <p>
                کاربر <span className="font-semibold text-gray-900">{userLabel}</span> و
                <span className="font-semibold text-gray-900"> تمام</span> اطلاعات او
                برای همیشه حذف می‌شود: آگهی‌ها، تخفیف‌یاب‌ها، فروشگاه‌ها، مشاغل، بوکمارک‌ها،
                گزارش‌ها، نوتیفیکیشن‌ها، گفتگوها و پیام‌ها، امتیازها و دستگاه‌ها.
              </p>
              <p className="font-medium text-red-600">
                این عملیات غیرقابل بازگشت است.
              </p>
              <p>
                برای تأیید، شماره موبایل کاربر (<span dir="ltr">{userMobile}</span>) را وارد
                کنید:
              </p>
            </div>

            <input
              type="text"
              dir="ltr"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={userMobile}
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isPending || typed.trim() !== userMobile}
                onClick={onConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-40"
              >
                {isPending ? 'در حال حذف…' : 'حذف کامل و همیشگی'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
