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
    throw new Error('انتخاب تصویر بنر الزامی است');
  }
  return existing;
}

function buildPayload(imageUrl: string, formData: FormData) {
  const link = String(formData.get('link') ?? '');
  return {
    imageUrl,
    cityId: String(formData.get('cityId') ?? ''),
    ...(link ? { link } : {}),
    order: Number(formData.get('order') ?? 0),
    isActive: formData.get('isActive') === 'on',
  };
}

export async function createBannerAction(formData: FormData): Promise<ActionResult> {
  const { token } = await requireAdminUser();
  try {
    const imageUrl = await resolveImageUrl(formData, token);
    await apiPost('/banners', buildPayload(imageUrl, formData), token);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطا در ایجاد بنر',
    };
  }
  revalidatePath('/dashboard/banners');
  return { success: true };
}

export async function updateBannerAction(id: string, formData: FormData): Promise<ActionResult> {
  const { token } = await requireAdminUser();
  try {
    const imageUrl = await resolveImageUrl(formData, token);
    await apiPatch(`/banners/${id}`, buildPayload(imageUrl, formData), token);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطا در ویرایش بنر',
    };
  }
  revalidatePath('/dashboard/banners');
  return { success: true };
}

export async function deleteBannerAction(id: string) {
  const { token } = await requireAdminUser();
  await apiDelete(`/banners/${id}`, token);
  revalidatePath('/dashboard/banners');
}
