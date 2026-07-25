'use client';

import { useState, useTransition } from 'react';
import { sendTestPushAction, type TestPushResult } from './actions';

export function TestPushButton() {
  const [result, setResult] = useState<TestPushResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const onTest = () => {
    setResult(null);
    startTransition(async () => {
      setResult(await sendTestPushAction());
    });
  };

  return (
    <div className="max-w-lg space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <div>
        <h2 className="text-sm font-semibold text-gray-800">تست ارسال به دستگاه‌های خودم</h2>
        <p className="mt-1 text-xs text-gray-500">
          یک نوتیفیکیشن تست فقط به دستگاه‌هایی که با همین حساب وارد اپ شده‌اند ارسال
          می‌شود تا مطمئن شوید مسیر ارسال کار می‌کند.
        </p>
      </div>

      <button
        type="button"
        onClick={onTest}
        disabled={isPending}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
      >
        {isPending ? 'در حال ارسال…' : 'ارسال نوتیفیکیشن تست'}
      </button>

      {result?.success && (
        <div className="space-y-1 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <p>
            نتیجه: {result.pushSuccessCount ?? 0} موفق
            {result.pushFailureCount ? ` / ${result.pushFailureCount} ناموفق` : ''}
            {` (از ${result.deviceCount ?? 0} دستگاه)`}
          </p>
          {!result.pushEnabled && (
            <p className="text-red-700">
              سرویس Push روی سرور غیرفعال است (کلید Firebase تنظیم نشده).
            </p>
          )}
          {result.pushEnabled && (result.deviceCount ?? 0) === 0 && (
            <p className="text-amber-700">
              با این حساب هیچ دستگاهی توکن ثبت نکرده — با گوشی وارد اپ شوید و مجوز
              نوتیفیکیشن را بدهید، سپس دوباره تست کنید.
            </p>
          )}
          {result.pushEnabled &&
            (result.deviceCount ?? 0) > 0 &&
            (result.pushSuccessCount ?? 0) > 0 && (
              <p>حالا گوشی خود را بررسی کنید؛ باید نوتیفیکیشن تست رسیده باشد.</p>
            )}
        </div>
      )}
      {result && !result.success && (
        <p className="text-sm text-red-600">{result.error}</p>
      )}
    </div>
  );
}
