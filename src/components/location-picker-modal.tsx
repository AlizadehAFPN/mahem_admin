'use client';

import dynamic from 'next/dynamic';
import { useState, useTransition } from 'react';
import { updateAdminEntityAction } from '@/lib/admin-edit-actions';

// Same ssr:false client-boundary wrapper pattern as ad-location-map.tsx.
const InteractiveLeafletMap = dynamic(() => import('./interactive-leaflet-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
      در حال بارگذاری نقشه…
    </div>
  ),
});

// Only Advertisement and Job have lat/lng (Store has a plain address string
// instead, no coordinates) — see mahem-backend's schema.prisma.
const DEFAULT_CENTER: [number, number] = [35.6892, 51.389]; // Tehran

export function LocationPickerModal({
  entityPath,
  id,
  lat,
  lng,
}: {
  entityPath: 'advertisements' | 'jobs';
  id: string;
  lat: number | null;
  lng: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<[number, number]>([
    lat ?? DEFAULT_CENTER[0],
    lng ?? DEFAULT_CENTER[1],
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onOpen = () => {
    setDraft([lat ?? DEFAULT_CENTER[0], lng ?? DEFAULT_CENTER[1]]);
    setError(null);
    setOpen(true);
  };

  const onConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateAdminEntityAction(entityPath, id, {
        lat: draft[0],
        lng: draft[1],
      });
      if (result.success) {
        setOpen(false);
      } else {
        setError(result.error ?? 'خطایی رخ داد.');
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className="text-gray-400 transition hover:text-gray-700"
        aria-label="ویرایش موقعیت مکانی"
      >
        ✏️
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-lg font-bold text-gray-900">ویرایش موقعیت مکانی</h3>
            <p className="mb-3 text-xs text-gray-500">
              روی نقشه کلیک کنید یا نشانگر را جابه‌جا کنید.
            </p>
            <div className="isolate h-72 w-full overflow-hidden rounded-xl ring-1 ring-gray-200">
              <InteractiveLeafletMap
                lat={draft[0]}
                lng={draft[1]}
                onChange={(newLat, newLng) => setDraft([newLat, newLng])}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500" dir="ltr">
              {draft[0].toFixed(6)}, {draft[1].toFixed(6)}
            </p>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isPending}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
              >
                {isPending ? 'در حال ذخیره…' : 'تایید'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
