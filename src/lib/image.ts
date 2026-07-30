// The admin panel is served over HTTPS (Vercel) while mahem-backend currently
// serves uploaded images over plain HTTP — browsers block/auto-upgrade that
// "mixed content" and the image silently fails to load. Routing it through
// our own same-origin (HTTPS) API route sidesteps the problem: the browser
// only ever talks to us over HTTPS, and the insecure hop to the backend
// happens server-side, where mixed content doesn't apply.
//
// This runs in client components too (chat message photos, the store/ad image
// editors), so it must NOT read process.env.BACKEND_URL: that variable is
// server-only and comes back undefined in the browser bundle. It used to be
// compared against the incoming URL here, which meant every client-side call
// decided «this isn't a backend URL» and handed back the raw http:// address —
// the exact images that then failed to render. Deciding whether a URL really
// belongs to the backend is the proxy route's job anyway; it runs on the
// server, where the env var exists.
export function proxiedImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  // Already proxied (a server component may have wrapped it before passing it
  // down as a prop) — wrapping twice would send the proxy its own URL.
  if (url.startsWith('/api/image-proxy')) return url;
  // Leave relative paths, data: and blob: (local file previews) alone: they
  // are same-origin or in-memory already, so there is nothing to proxy.
  if (!/^https?:\/\//i.test(url)) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}
