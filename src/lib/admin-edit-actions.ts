'use server';

import { revalidatePath } from 'next/cache';
import { apiPatch, apiUpload, ApiError } from './api';
import { requireSuperAdmin } from './session';

export type AdminEditableEntity = 'advertisements' | 'stores' | 'jobs';

export interface EditActionResult {
  success: boolean;
  error?: string;
}

const DETAIL_PATH: Record<AdminEditableEntity, (id: string) => string> = {
  advertisements: id => `/dashboard/advertisements/${id}`,
  stores: id => `/dashboard/stores/${id}`,
  jobs: id => `/dashboard/jobs/${id}`,
};

// Backs InlineEditField/ImageArrayEditor/SingleImageEditor/
// LocationPickerModal — all of them just PATCH one or more fields on the
// SUPER_ADMIN-only /admin/{entity}/:id route (see AdminAdvertisementsController
// .adminUpdate and its Store/Job equivalents in mahem-backend).
export async function updateAdminEntityAction(
  entityPath: AdminEditableEntity,
  id: string,
  data: Record<string, unknown>,
): Promise<EditActionResult> {
  const { token } = await requireSuperAdmin();
  try {
    await apiPatch(`/admin/${entityPath}/${id}`, data, token);
  } catch (error) {
    return {
      success: false,
      error: error instanceof ApiError ? error.message : 'ذخیره تغییرات با خطا مواجه شد.',
    };
  }
  revalidatePath(DETAIL_PATH[entityPath](id));
  return { success: true };
}

// Entity-agnostic — POST /uploads doesn't care which entity the image will
// end up attached to, the caller patches the resulting url onto the field
// itself right after via updateAdminEntityAction.
export async function uploadEntityImageAction(
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  const { token } = await requireSuperAdmin();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'فایلی انتخاب نشده است' };
  }
  try {
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    const uploaded = await apiUpload<{ url: string }>('/uploads', uploadForm, token);
    return { url: uploaded.url };
  } catch (error) {
    return {
      error: error instanceof ApiError ? error.message : 'آپلود تصویر با خطا مواجه شد.',
    };
  }
}
