'use client';

import { useEffect } from 'react';

// Covers every page under /dashboard. Each one fetches from mahem-backend
// while rendering on the server, so anything that makes the API briefly
// unreachable — a deploy restarting the app container, a network blip —
// throws mid-render and Next replies 500 with «This page couldn't load» and a
// digest, deliberately hiding the reason in production. That looks like the
// panel is broken rather than like the backend was busy for ten seconds, and
// the only way out was a manual reload.
//
// Here that same failure becomes a readable message and a retry that re-runs
// the server render in place. Nothing is swallowed: the error still reaches
// the console (and Vercel's logs) for anything that isn't transient.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard render failed:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="text-4xl">⚠️</div>
      <h1 className="text-xl font-bold text-gray-900">
        بارگذاری این صفحه ناموفق بود
      </h1>
      <p className="max-w-md text-sm leading-6 text-gray-500">
        ارتباط با سرور برقرار نشد. اگر همین الان تغییری روی سرور اعمال شده،
        چند ثانیه بعد دوباره تلاش کنید.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-gray-400">کد خطا: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
      >
        تلاش دوباره
      </button>
    </div>
  );
}
