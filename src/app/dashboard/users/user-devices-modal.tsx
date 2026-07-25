'use client';

import { useState, useTransition } from 'react';
import type { DeviceInfo } from '@/lib/types';
import {
  getUserDevicesAction,
  sendUserNotificationAction,
  type SendNotificationResult,
} from './actions';

function faDateTime(iso: string) {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function platformLabel(d: DeviceInfo) {
  const p = (d.osName ?? d.platform ?? '').toLowerCase();
  if (p.includes('ios')) return 'iOS';
  if (p.includes('android')) return 'اندروید';
  return d.platform ?? '—';
}

export function UserDevicesModal({
  userId,
  userLabel,
  deviceCount,
  canSendNotification,
}: {
  userId: string;
  userLabel: string;
  deviceCount: number;
  canSendNotification: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [devices, setDevices] = useState<DeviceInfo[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, startSending] = useTransition();
  const [sendResult, setSendResult] = useState<SendNotificationResult | null>(null);

  const load = () => {
    setLoadError(null);
    startLoading(async () => {
      const res = await getUserDevicesAction(userId);
      if (res.success) {
        setDevices(res.devices ?? []);
      } else {
        setLoadError(res.error ?? 'خطا در دریافت دستگاه‌ها');
      }
    });
  };

  const openModal = () => {
    setOpen(true);
    setSendResult(null);
    load();
  };

  const onSend = () => {
    setSendResult(null);
    const fd = new FormData();
    fd.set('title', title);
    fd.set('body', body);
    startSending(async () => {
      const res = await sendUserNotificationAction(userId, fd);
      setSendResult(res);
      if (res.success) {
        setTitle('');
        setBody('');
      }
    });
  };

  return (
    <>
      <button
        onClick={openModal}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
      >
        دستگاه‌ها ({deviceCount})
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                دستگاه‌های {userLabel}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
              >
                بستن
              </button>
            </div>

            <div className="mt-4">
              {loading && <p className="text-sm text-gray-500">در حال بارگذاری…</p>}
              {loadError && <p className="text-sm text-red-600">{loadError}</p>}
              {devices && devices.length === 0 && !loading && (
                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  این کاربر هیچ دستگاهی ثبت نکرده است؛ نوتیفیکیشن به او روی گوشی نمایش
                  داده نمی‌شود.
                </p>
              )}
              {devices && devices.length > 0 && (
                <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200">
                  <table className="w-full text-right text-xs">
                    <thead className="border-b border-gray-200 bg-gray-50 font-semibold text-gray-500">
                      <tr>
                        <th className="px-3 py-2">دستگاه</th>
                        <th className="px-3 py-2">مدل</th>
                        <th className="px-3 py-2">سیستم‌عامل</th>
                        <th className="px-3 py-2">نسخه اپ</th>
                        <th className="px-3 py-2">آخرین فعالیت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devices.map(d => (
                        <tr key={d.id} className="border-b border-gray-100 last:border-0">
                          <td className="px-3 py-2 text-gray-800">{d.deviceName ?? '—'}</td>
                          <td className="px-3 py-2 text-gray-600">{d.deviceModel ?? '—'}</td>
                          <td className="px-3 py-2 text-gray-600">
                            {platformLabel(d)}
                            {d.osVersion ? ` ${d.osVersion}` : ''}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{d.appVersion ?? '—'}</td>
                          <td className="px-3 py-2 text-gray-500">{faDateTime(d.updatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {canSendNotification && (
              <div className="mt-6 space-y-3 border-t border-gray-200 pt-5">
                <h4 className="text-sm font-semibold text-gray-800">
                  ارسال نوتیفیکیشن به این کاربر
                </h4>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="عنوان"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="متن پیام"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />

                {sendResult?.success && (
                  <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    ثبت شد. ارسال به دستگاه‌ها: {sendResult.pushSuccessCount} موفق
                    {sendResult.pushFailureCount ? ` / ${sendResult.pushFailureCount} ناموفق` : ''}
                    {` (از ${sendResult.deviceCount} دستگاه)`}
                    {sendResult.deviceCount === 0 &&
                      ' — این کاربر دستگاهی ندارد، پیام فقط داخل اپ ذخیره شد.'}
                  </p>
                )}
                {sendResult && !sendResult.success && (
                  <p className="text-sm text-red-600">{sendResult.error}</p>
                )}

                <button
                  type="button"
                  disabled={sending || !title.trim() || !body.trim()}
                  onClick={onSend}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
                >
                  {sending ? 'در حال ارسال…' : 'ارسال نوتیفیکیشن'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
