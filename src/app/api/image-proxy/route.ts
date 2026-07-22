import { NextRequest, NextResponse } from 'next/server';

const BACKEND_ORIGIN = new URL(process.env.BACKEND_URL ?? 'http://localhost:3000/api').origin;

// Streams an image from mahem-backend through our own HTTPS origin so the
// browser never has to load mixed (HTTP) content directly. Only ever
// forwards requests to the known backend origin — never an arbitrary URL —
// to avoid this becoming an open SSRF proxy.
export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get('url');
  if (!target || !target.startsWith(BACKEND_ORIGIN)) {
    return NextResponse.json({ message: 'Invalid image URL' }, { status: 400 });
  }

  const upstream = await fetch(target, { cache: 'no-store' });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ message: 'Image not found' }, { status: 404 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
