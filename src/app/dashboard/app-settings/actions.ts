'use server';

import { revalidatePath } from 'next/cache';
import { apiPatch, ApiError } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import type { AppSettings } from './page';

export interface UpdateAppSettingsResult {
  success: boolean;
  error?: string;
}

export async function updateAppSettingsAction(
  values: AppSettings,
): Promise<UpdateAppSettingsResult> {
  const { token } = await requireAdminUser();

  try {
    await apiPatch<AppSettings>('/app-settings', values, token);
    revalidatePath('/dashboard/app-settings');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof ApiError ? error.message : 'ذخیره تنظیمات با خطا مواجه شد.',
    };
  }
}
