'use server';

import { revalidatePath } from 'next/cache';
import { apiPatch, ApiError } from '@/lib/api';
import { requireSuperAdmin } from '@/lib/session';

export interface UpdateRoleResult {
  success: boolean;
  error?: string;
}

export async function updateUserRoleAction(
  userId: string,
  formData: FormData,
): Promise<UpdateRoleResult> {
  const { token } = await requireSuperAdmin();
  const role = String(formData.get('role') ?? '');

  try {
    await apiPatch(`/admin/users/${userId}/role`, { role }, token);
  } catch (error) {
    return {
      success: false,
      error: error instanceof ApiError ? error.message : 'تغییر نقش با خطا مواجه شد.',
    };
  }

  revalidatePath('/dashboard/users');
  return { success: true };
}
