'use server';

import { revalidatePath } from 'next/cache';
import { apiDelete, apiPatch, apiPost, ApiError } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import type { ActionResult } from '@/components/entity-modal';

function buildPayload(formData: FormData) {
  return {
    groupKey: String(formData.get('groupKey')),
    label: String(formData.get('label')),
    order: Number(formData.get('order') ?? 0),
  };
}

export async function createAttributeOptionAction(formData: FormData): Promise<ActionResult> {
  const { token } = await requireAdminUser();
  try {
    await apiPost('/attribute-options', buildPayload(formData), token);
  } catch (error) {
    return {
      success: false,
      error: error instanceof ApiError ? error.message : 'خطا در ایجاد گزینه',
    };
  }
  revalidatePath('/dashboard/attribute-options');
  return { success: true };
}

export async function updateAttributeOptionAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const { token } = await requireAdminUser();
  try {
    await apiPatch(
      `/attribute-options/${id}`,
      {
        label: String(formData.get('label')),
        order: Number(formData.get('order') ?? 0),
        isActive: formData.get('isActive') === 'on',
      },
      token,
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof ApiError ? error.message : 'خطا در ویرایش گزینه',
    };
  }
  revalidatePath('/dashboard/attribute-options');
  return { success: true };
}

export async function deleteAttributeOptionAction(id: string) {
  const { token } = await requireAdminUser();
  await apiDelete(`/attribute-options/${id}`, token);
  revalidatePath('/dashboard/attribute-options');
}
