'use client';

import { useState, useTransition } from 'react';
import { broadcastNotificationAction } from './actions';

export function BroadcastForm({ totalUsers }: { totalUsers: number }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentCount, setSentCount] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSend = () => {
    setError(null);
    const formData = new FormData();
    formData.set('title', title);
    formData.set('body', body);
    startTransition(async () => {
      const result = await broadcastNotificationAction(formData);
      if (result.success) {
        setSentCount(result.usersNotified ?? totalUsers);
        setConfirming(false);
        setTitle('');
        setBody('');
      } else {
        setError(result.error ?? 'خطایی رخ داد.');
      }
    });
  };

  return (
    <div className="max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">عنوان</label>
        <input
          type="text"
          value={title}
          onChange={e => {
            setTitle(e.target.value);
            setSentCount(null);
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
            setSentCount(null);
          }}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {sentCount !== null && (
        <p className="text-sm text-green-600">
          پیام با موفقیت برای {sentCount} کاربر ارسال شد.
        </p>
      )}

      {!confirming ? (
        <button
          type="button"
          disabled={!title.trim() || !body.trim()}
          onClick={() => setConfirming(true)}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-40"
        >
          ارسال به همه کاربران
        </button>
      ) : (
        <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            این پیام برای همه {totalUsers} کاربر فعلی اپلیکیشن ارسال خواهد شد. این عملیات
            قابل بازگشت نیست، آیا مطمئن هستید؟
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
