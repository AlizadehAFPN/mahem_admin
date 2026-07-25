'use server';

import { revalidatePath } from 'next/cache';
import { apiDelete, apiPatch, apiPost, ApiError } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import type { ActionResult } from '@/components/entity-modal';

export async function createCityAction(formData: FormData): Promise<ActionResult> {
  const { token } = await requireAdminUser();
  try {
    await apiPost(
      '/cities',
      {
        name: String(formData.get('name')),
        slug: String(formData.get('slug')),
        lat: Number(formData.get('lat')),
        lng: Number(formData.get('lng')),
      },
      token,
    );
  } catch (error) {
    return { success: false, error: error instanceof ApiError ? error.message : 'خطا در ایجاد شهر' };
  }
  revalidatePath('/dashboard/cities');
  return { success: true };
}

export async function updateCityAction(id: string, formData: FormData): Promise<ActionResult> {
  const { token } = await requireAdminUser();
  try {
    await apiPatch(
      `/cities/${id}`,
      {
        name: String(formData.get('name')),
        slug: String(formData.get('slug')),
        lat: Number(formData.get('lat')),
        lng: Number(formData.get('lng')),
      },
      token,
    );
  } catch (error) {
    return { success: false, error: error instanceof ApiError ? error.message : 'خطا در ویرایش شهر' };
  }
  revalidatePath('/dashboard/cities');
  return { success: true };
}

export async function deleteCityAction(id: string) {
  const { token } = await requireAdminUser();
  await apiDelete(`/cities/${id}`, token);
  revalidatePath('/dashboard/cities');
}
