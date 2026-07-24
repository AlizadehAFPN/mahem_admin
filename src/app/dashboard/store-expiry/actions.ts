'use server';

import { revalidatePath } from 'next/cache';
import { apiPatch, ApiError } from '@/lib/api';
import { requireSuperAdmin } from '@/lib/session';

export interface UpdateStoreExpiryResult {
  success: boolean;
  error?: string;
  expiryDays?: number;
}

export async function updateStoreExpirySettingAction(
  formData: FormData,
): Promise<UpdateStoreExpiryResult> {
  const { token } = await requireSuperAdmin();
  const expiryDays = Number(formData.get('expiryDays'));

  try {
    const result = await apiPatch<{ expiryDays: number }>(
      '/admin/store-expiry-settings',
      { expiryDays },
      token,
    );
    revalidatePath('/dashboard/store-expiry');
    return { success: true, expiryDays: result.expiryDays };
  } catch (error) {
    return {
      success: false,
      error: error instanceof ApiError ? error.message : 'ذخیره تنظیمات با خطا مواجه شد.',
    };
  }
}
