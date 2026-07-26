'use server';

import { revalidatePath } from 'next/cache';
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from '@/lib/api';
import { requireAdminUser, requireSuperAdmin } from '@/lib/session';
import type { DeviceInfo } from '@/lib/types';

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

export interface SendNotificationResult {
  success: boolean;
  error?: string;
  deviceCount?: number;
  pushSuccessCount?: number;
  pushFailureCount?: number;
}

export async function sendUserNotificationAction(
  userId: string,
  formData: FormData,
): Promise<SendNotificationResult> {
  const { token } = await requireSuperAdmin();
  const title = String(formData.get('title') ?? '');
  const body = String(formData.get('body') ?? '');

  try {
    const result = await apiPost<{
      deviceCount: number;
      pushSuccessCount: number;
      pushFailureCount: number;
    }>(`/admin/notifications/users/${userId}`, { title, body }, token);
    return {
      success: true,
      deviceCount: result.deviceCount,
      pushSuccessCount: result.pushSuccessCount,
      pushFailureCount: result.pushFailureCount,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof ApiError ? error.message : 'ارسال نوتیفیکیشن با خطا مواجه شد.',
    };
  }
}

export interface DeleteUserResult {
  success: boolean;
  error?: string;
}

export async function deleteUserAction(
  userId: string,
): Promise<DeleteUserResult> {
  const { token } = await requireSuperAdmin();
  try {
    await apiDelete(`/admin/users/${userId}`, token);
  } catch (error) {
    return {
      success: false,
      error: error instanceof ApiError ? error.message : 'حذف کاربر با خطا مواجه شد.',
    };
  }
  revalidatePath('/dashboard/users');
  return { success: true };
}

export interface DevicesResult {
  success: boolean;
  error?: string;
  devices?: DeviceInfo[];
}

export async function getUserDevicesAction(userId: string): Promise<DevicesResult> {
  const { token } = await requireAdminUser();
  try {
    const devices = await apiGet<DeviceInfo[]>(`/admin/users/${userId}/devices`, token);
    return { success: true, devices };
  } catch (error) {
    return {
      success: false,
      error: error instanceof ApiError ? error.message : 'دریافت لیست دستگاه‌ها با خطا مواجه شد.',
    };
  }
}
