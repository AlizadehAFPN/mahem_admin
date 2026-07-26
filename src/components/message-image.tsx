'use client';

import { useEffect, useState } from 'react';
import { proxiedImageUrl } from '@/lib/image';

// An image sent inside a chat message, shown as a thumbnail in the thread and
// opened full-size on click — the same interaction the app's chat has, so
// support can read a conversation the way the two users see it.
//
// The full-size view goes through the image proxy as well: uploads live on the
// backend host, which the browser would otherwise be loading cross-origin.
export function MessageImage({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  const src = proxiedImageUrl(url);

  // Escape closes it, matching the browser habit for a full-screen overlay.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block cursor-zoom-in overflow-hidden rounded-xl ring-1 ring-black/5"
        aria-label="نمایش تصویر در اندازه کامل"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="تصویر پیام"
          className="h-40 w-40 bg-gray-100 object-cover"
        />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="تصویر پیام"
            className="max-h-full max-w-full object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 left-4 rounded-full bg-black/60 px-4 py-2 text-sm text-white transition hover:bg-black/80"
          >
            ✕ بستن
          </button>
        </div>
      )}
    </>
  );
}
