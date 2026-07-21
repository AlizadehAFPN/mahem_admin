'use server';

import { redirect } from 'next/navigation';
import { apiGet, apiPost, ApiError } from '@/lib/api';
import { setSessionCookies } from '@/lib/session';
import type { AdminUser } from '@/lib/types';

export interface RequestOtpResult {
  success: boolean;
  error?: string;
  devCode?: string;
}

export async function requestOtpAction(mobile: string): Promise<RequestOtpResult> {
  try {
    const result = await apiPost<{
      mobile: string;
      expiresInSeconds: number;
      code?: string;
    }>('/auth/otp/request', { mobile });
    return { success: true, devCode: result.code };
  } catch (error) {
    return {
      success: false,
      error: error instanceof ApiError ? error.message : 'خطا در ارسال کد. دوباره تلاش کنید.',
    };
  }
}

export interface VerifyOtpResult {
  success: boolean;
  error?: string;
}

export async function verifyOtpAction(mobile: string, code: string): Promise<VerifyOtpResult> {
  let tokens: { accessToken: string; refreshToken: string };
  try {
    tokens = await apiPost('/auth/otp/verify', { mobile, code });
  } catch (error) {
    return {
      success: false,
      error: error instanceof ApiError ? error.message : 'کد وارد شده صحیح نیست.',
    };
  }

  let user: AdminUser;
  try {
    user = await apiGet<AdminUser>('/users/me', tokens.accessToken);
  } catch {
    return { success: false, error: 'خطا در دریافت اطلاعات کاربر.' };
  }

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'شما دسترسی ادمین ندارید.' };
  }

  await setSessionCookies(tokens.accessToken, tokens.refreshToken);
  redirect('/dashboard');
}
