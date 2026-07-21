'use server';

import { redirect } from 'next/navigation';
import { apiPost } from './api';
import { clearSessionCookies, getRefreshToken } from './session';

export async function logoutAction() {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    await apiPost('/auth/logout', { refreshToken }).catch(() => undefined);
  }
  await clearSessionCookies();
  redirect('/login');
}
