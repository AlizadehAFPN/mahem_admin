'use server';

import { apiPost, ApiError } from '@/lib/api';
import { requireSuperAdmin } from '@/lib/session';

export interface BroadcastResult {
  success: boolean;
  error?: string;
  usersNotified?: number;
}

export async function broadcastNotificationAction(
  formData: FormData,
): Promise<BroadcastResult> {
  const { token } = await requireSuperAdmin();
  const title = String(formData.get('title') ?? '');
  const body = String(formData.get('body') ?? '');

  try {
    const result = await apiPost<{ usersNotified: number }>(
      '/admin/notifications/broadcast',
      { title, body },
      token,
    );
    return { success: true, usersNotified: result.usersNotified };
  } catch (error) {
    return {
      success: false,
      error: error instanceof ApiError ? error.message : 'ارسال نوتیفیکیشن با خطا مواجه شد.',
    };
  }
}
