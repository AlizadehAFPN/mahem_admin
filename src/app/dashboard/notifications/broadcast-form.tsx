'use client';

import { useState, useTransition } from 'react';
import { broadcastNotificationAction, type BroadcastResult } from './actions';

interface CityOption {
  value: string;
  label: string;
}

export function BroadcastForm({
  totalUsers,
  cityOptions,
}: {
  totalUsers: number;
  cityOptions: CityOption[];
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [cityId, setCityId] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCityLabel = cityOptions.find(c => c.value === cityId)?.label;
  const audienceLabel = selectedCityLabel
    ? `کاربران شهر ${selectedCityLabel}`
    : `همه ${totalUsers} کاربر`;

  const onSend = () => {
    setError(null);
    const formData = new FormData();
    formData.set('title', title);
    formData.set('body', body);
    formData.set('cityId', cityId);
    startTransition(async () => {
      const res = await broadcastNotificationAction(formData);
      if (res.success) {
        setResult(res);
        setConfirming(false);
        setTitle('');
        setBody('');
      } else {
        setError(res.error ?? 'خطایی رخ داد.');
      }
    });
  };

  return (
    <div className="max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">ارسال به</label>
        <select
          value={cityId}
          onChange={e => {
            setCityId(e.target.value);
            setResult(null);
            setConfirming(false);
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">همه شهرها</option>
          {cityOptions.map(c => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">عنوان</label>
        <input
          type="text"
          value={title}
          onChange={e => {
            setTitle(e.target.value);
            setResult(null);
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">متن پیام</label>
        <textarea
          value={body}
          onChange={e => {
            setBody(e.target.value);
            setResult(null);
          }}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {result?.success && (
        <div className="space-y-1 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <p>پیام برای {result.usersNotified ?? 0} کاربر ثبت شد.</p>
          <p>
            ارسال روی گوشی‌ها: {result.pushSuccessCount ?? 0} موفق
            {result.pushFailureCount ? ` / ${result.pushFailureCount} ناموفق` : ''}
            {` (از ${result.deviceCount ?? 0} دستگاه ثبت‌شده)`}
          </p>
          {(result.deviceCount ?? 0) === 0 && (
            <p className="text-amber-700">
              هیچ دستگاهی توکن ثبت نکرده است؛ پیام فقط داخل اپ ذخیره شد و روی گوشی
              نمایش داده نمی‌شود.
            </p>
          )}
        </div>
      )}

      {!confirming ? (
        <button
          type="button"
          disabled={!title.trim() || !body.trim()}
          onClick={() => setConfirming(true)}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-40"
        >
          {selectedCityLabel
            ? `ارسال به کاربران ${selectedCityLabel}`
            : 'ارسال به همه کاربران'}
        </button>
      ) : (
        <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            این پیام برای {audienceLabel} ارسال خواهد شد. این عملیات قابل بازگشت نیست،
            آیا مطمئن هستید؟
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              انصراف
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={onSend}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? 'در حال ارسال…' : 'تایید و ارسال'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
