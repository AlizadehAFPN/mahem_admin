'use client';

import { useState, useTransition } from 'react';
import { updateAdExpirySettingAction } from './actions';

export function ExpirySettingsForm({ initialExpiryDays }: { initialExpiryDays: number | null }) {
  const [expiryDays, setExpiryDays] = useState(String(initialExpiryDays ?? ''));
  const [savedDays, setSavedDays] = useState(initialExpiryDays);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSave = () => {
    setError(null);
    const formData = new FormData();
    formData.set('expiryDays', expiryDays);
    startTransition(async () => {
      const result = await updateAdExpirySettingAction(formData);
      if (result.success) {
        setSavedDays(result.expiryDays ?? null);
      } else {
        setError(result.error ?? 'خطایی رخ داد.');
      }
    });
  };

  const days = Number(expiryDays);
  const isValid = expiryDays.trim() !== '' && Number.isInteger(days) && days >= 1;

  return (
    <div className="max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">
          مدت اعتبار آگهی (روز)
        </label>
        <input
          type="number"
          min={1}
          step={1}
          value={expiryDays}
          onChange={e => setExpiryDays(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="مثلاً 30"
        />
        <p className="mt-2 text-xs text-gray-500">
          هر آگهی جدید، از لحظه ثبت به مدت این تعداد روز فعال می‌ماند و پس از آن به‌صورت
          خودکار آرشیو می‌شود. تغییر این عدد فقط روی آگهی‌های جدید (بعد از این تغییر) اثر
          می‌گذارد؛ آگهی‌های قبلی دست‌نخورده باقی می‌مانند مگر این‌که به‌صورت دستی ویرایش
          شوند.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {savedDays != null && !error && (
        <p className="text-sm text-green-600">
          تنظیمات ذخیره شد: آگهی‌های جدید {savedDays} روز اعتبار دارند.
        </p>
      )}

      <button
        type="button"
        disabled={!isValid || isPending}
        onClick={onSave}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-40"
      >
        {isPending ? 'در حال ذخیره…' : 'ذخیره'}
      </button>
    </div>
  );
}
