import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Every image in this panel (splash screens, banners, ad photos, store
      // logos) is uploaded through a Server Action, and Next caps a Server
      // Action body at 1 MB by default. A full-screen splash photo is well
      // over that, so the upload died with a 413 before it ever reached
      // mahem-backend — the panel showed «This page couldn't load» and the
      // backend logged nothing at all, because nothing arrived.
      //
      // Matched to the backend's own MAX_FILE_SIZE_BYTES (5 MB, see
      // UploadsController), plus a small margin for the multipart envelope
      // and the other form fields, so the backend's limit is the one that
      // actually decides — and rejects with a message the admin can read.
      bodySizeLimit: '6mb',
    },
  },
};

export default nextConfig;
