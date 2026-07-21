'use server';

import { revalidatePath } from 'next/cache';
import { apiDelete, apiPatch, apiPost, apiUpload } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import type { ActionResult } from '@/components/entity-modal';

async function resolveImageUrl(formData: FormData, token: string): Promise<string> {
  const file = formData.get('imageFile');
  if (file instanceof File && file.size > 0) {
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    const uploaded = await apiUpload<{ url: string }>('/uploads', uploadForm, token);
    return uploaded.url;
  }

  const existing = String(formData.get('imageUrl') ?? '');
  if (!existing) {
    throw new Error('انتخاب تصویر اسپلش الزامی است');
  }
  return existing;
}

export async function createSplashScreenAction(formData: FormData): Promise<ActionResult> {
  const { token } = await requireAdminUser();
  try {
    const imageUrl = await resolveImageUrl(formData, token);
    const cityId = String(formData.get('cityId') ?? '');
    await apiPost('/splash-screens', { cityId, imageUrl }, token);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطا در ایجاد اسپلش',
    };
  }
  revalidatePath('/dashboard/splash-screens');
  return { success: true };
}

export async function updateSplashScreenAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const { token } = await requireAdminUser();
  try {
    const imageUrl = await resolveImageUrl(formData, token);
    await apiPatch(`/splash-screens/${id}`, { imageUrl }, token);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطا در ویرایش اسپلش',
    };
  }
  revalidatePath('/dashboard/splash-screens');
  return { success: true };
}

export async function deleteSplashScreenAction(id: string) {
  const { token } = await requireAdminUser();
  await apiDelete(`/splash-screens/${id}`, token);
  revalidatePath('/dashboard/splash-screens');
}
