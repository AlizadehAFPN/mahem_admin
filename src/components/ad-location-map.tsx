'use client';

import dynamic from 'next/dynamic';

// Leaflet touches `window` as soon as its module is evaluated, so the actual
// map implementation must never be part of the server-rendered bundle. This
// wrapper is itself a client component (safe to import from a server page),
// but it loads the real map lazily with `ssr: false` — Next.js only allows
// that option inside a client boundary, not directly inside a server page.
const LeafletMap = dynamic(() => import('./leaflet-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
      در حال بارگذاری نقشه…
    </div>
  ),
});

export function AdLocationMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="h-72 w-full overflow-hidden rounded-2xl ring-1 ring-gray-200">
      <LeafletMap lat={lat} lng={lng} />
    </div>
  );
}
