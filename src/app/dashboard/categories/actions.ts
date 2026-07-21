'use server';

import { revalidatePath } from 'next/cache';
import { apiDelete, apiPatch, apiPost, ApiError } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import type { ActionResult } from '@/components/entity-modal';

function buildPayload(formData: FormData) {
  const parentId = String(formData.get('parentId') ?? '');
  const icon = String(formData.get('icon') ?? '');
  return {
    name: String(formData.get('name')),
    slug: String(formData.get('slug')),
    type: String(formData.get('type')),
    ...(icon ? { icon } : {}),
    ...(parentId ? { parentId } : {}),
  };
}

export async function createCategoryAction(formData: FormData): Promise<ActionResult> {
  const { token } = await requireAdminUser();
  try {
    await apiPost('/categories', buildPayload(formData), token);
  } catch (error) {
    return {
      success: false,
      error: error instanceof ApiError ? error.message : 'خطا در ایجاد دسته‌بندی',
    };
  }
  revalidatePath('/dashboard/categories');
  return { success: true };
}

export async function updateCategoryAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const { token } = await requireAdminUser();
  try {
    await apiPatch(`/categories/${id}`, buildPayload(formData), token);
  } catch (error) {
    return {
      success: false,
      error: error instanceof ApiError ? error.message : 'خطا در ویرایش دسته‌بندی',
    };
  }
  revalidatePath('/dashboard/categories');
  return { success: true };
}

export async function deleteCategoryAction(id: string) {
  const { token } = await requireAdminUser();
  await apiDelete(`/categories/${id}`, token);
  revalidatePath('/dashboard/categories');
}
