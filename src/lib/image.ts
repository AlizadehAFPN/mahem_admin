const BACKEND_ORIGIN = new URL(process.env.BACKEND_URL ?? 'http://localhost:3000/api').origin;

// The admin panel is served over HTTPS (Vercel) while mahem-backend currently
// serves uploaded images over plain HTTP — browsers block/auto-upgrade that
// "mixed content" and the image silently fails to load. Routing it through
// our own same-origin (HTTPS) API route sidesteps the problem: the browser
// only ever talks to us over HTTPS, and the insecure hop to the backend
// happens server-side, where mixed content doesn't apply.
export function proxiedImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (!url.startsWith(BACKEND_ORIGIN)) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}
