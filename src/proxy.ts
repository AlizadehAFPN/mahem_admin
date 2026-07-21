import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3000/api';
const ACCESS_COOKIE = 'mahem_admin_access';
const REFRESH_COOKIE = 'mahem_admin_refresh';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

function decodeJwtExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized)) as { exp?: number };
    return decoded.exp ?? null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const exp = accessToken ? decodeJwtExpiry(accessToken) : null;
  const isExpiringSoon = !exp || exp * 1000 < Date.now() + 60_000;

  if (!isExpiringSoon) {
    return NextResponse.next();
  }

  try {
    const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      throw new Error('refresh failed');
    }
    const data: { accessToken: string; refreshToken: string } = await res.json();

    const response = NextResponse.next();
    response.cookies.set(ACCESS_COOKIE, data.accessToken, cookieOptions);
    response.cookies.set(REFRESH_COOKIE, data.refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
    return response;
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
