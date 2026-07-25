'use server';

import { apiPost, ApiError } from '@/lib/api';
import { requireSuperAdmin } from '@/lib/session';

export interface BroadcastResult {
  success: boolean;
  error?: string;
  usersNotified?: number;
  deviceCount?: number;
  pushSuccessCount?: number;
  pushFailureCount?: number;
}

export async function broadcastNotificationAction(
  formData: FormData,
): Promise<BroadcastResult> {
  const { token } = await requireSuperAdmin();
  const title = String(formData.get('title') ?? '');
  const body = String(formData.get('body') ?? '');
  const cityId = String(formData.get('cityId') ?? '').trim() || undefined;

  try {
    const result = await apiPost<{
      usersNotified: number;
      deviceCount: number;
      pushSuccessCount: number;
      pushFailureCount: number;
    }>('/admin/notifications/broadcast', { title, body, cityId }, token);
    return {
      success: true,
      usersNotified: result.usersNotified,
      deviceCount: result.deviceCount,
      pushSuccessCount: result.pushSuccessCount,
      pushFailureCount: result.pushFailureCount,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof ApiError ? error.message : 'ارسال نوتیفیکیشن با خطا مواجه شد.',
    };
  }
}

export interface TestPushResult {
  success: boolean;
  error?: string;
  pushEnabled?: boolean;
  deviceCount?: number;
  pushSuccessCount?: number;
  pushFailureCount?: number;
}

export async function sendTestPushAction(): Promise<TestPushResult> {
  const { token } = await requireSuperAdmin();
  try {
    const result = await apiPost<{
      pushEnabled: boolean;
      deviceCount: number;
      pushSuccessCount: number;
      pushFailureCount: number;
    }>('/admin/notifications/test', {}, token);
    return { success: true, ...result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof ApiError ? error.message : 'ارسال تست با خطا مواجه شد.',
    };
  }
}
