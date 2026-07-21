'use client';

import { useState, useTransition } from 'react';
import { requestOtpAction, verifyOtpAction } from './actions';

export function LoginForm() {
  const [step, setStep] = useState<'mobile' | 'code'>('mobile');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmitMobile = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestOtpAction(mobile);
      if (!result.success) {
        setError(result.error ?? 'خطا در ارسال کد.');
        return;
      }
      setDevCode(result.devCode ?? null);
      setStep('code');
    });
  };

  const onSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await verifyOtpAction(mobile, code);
      if (!result.success) {
        setError(result.error ?? 'کد وارد شده صحیح نیست.');
      }
    });
  };

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
      <h1 className="text-center text-xl font-bold text-gray-900">ورود به پنل مدیریت ماهم</h1>
      <p className="mt-1 text-center text-sm text-gray-500">
        {step === 'mobile' ? 'شماره موبایل ادمین را وارد کنید' : `کد ارسال‌شده به ${mobile} را وارد کنید`}
      </p>

      {step === 'mobile' ? (
        <form className="mt-6 space-y-4" onSubmit={onSubmitMobile}>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="09123456789"
            value={mobile}
            onChange={e => setMobile(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-lg tracking-widest focus:border-gray-900 focus:outline-none"
            dir="ltr"
            required
          />
          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-gray-900 py-2.5 font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
          >
            {isPending ? 'در حال ارسال…' : 'ارسال کد'}
          </button>
        </form>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={onSubmitCode}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="کد تایید"
            value={code}
            onChange={e => setCode(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-lg tracking-[0.5em] focus:border-gray-900 focus:outline-none"
            dir="ltr"
            maxLength={8}
            required
            autoFocus
          />
          {devCode && (
            <p className="text-center text-xs text-amber-600">
              حالت آزمایشی — کد: <span dir="ltr">{devCode}</span>
            </p>
          )}
          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-gray-900 py-2.5 font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
          >
            {isPending ? 'در حال بررسی…' : 'ورود'}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('mobile');
              setCode('');
              setError(null);
            }}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
          >
            تغییر شماره موبایل
          </button>
        </form>
      )}
    </div>
  );
}
