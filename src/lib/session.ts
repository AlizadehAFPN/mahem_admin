import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiGet } from './api';
import type { AdminUser } from './types';

export const ACCESS_COOKIE = 'mahem_admin_access';
export const REFRESH_COOKIE = 'mahem_admin_refresh';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export async function setSessionCookies(accessToken: string, refreshToken: string) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, accessToken, cookieOptions);
  store.set(REFRESH_COOKIE, refreshToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function getAccessToken() {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken() {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value;
}

// Middleware already keeps the access token fresh and redirects unauthenticated
// requests to /login before a page ever renders — this is a defense-in-depth
// check that also confirms the ADMIN/SUPER_ADMIN role for every protected page.
export async function requireAdminUser(): Promise<{ user: AdminUser; token: string }> {
  const token = await getAccessToken();
  if (!token) {
    redirect('/login');
  }

  try {
    const user = await apiGet<AdminUser>('/users/me', token);
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      await clearSessionCookies();
      redirect('/login?error=forbidden');
    }
    return { user, token };
  } catch {
    redirect('/login');
  }
}

export async function requireSuperAdmin(): Promise<{ user: AdminUser; token: string }> {
  const session = await requireAdminUser();
  if (session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard?error=forbidden');
  }
  return session;
}
