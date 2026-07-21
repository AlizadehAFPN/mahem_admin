'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiDelete, apiPatch } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';

export async function approveStoreAction(id: string) {
  const { token } = await requireAdminUser();
  await apiPatch(`/admin/stores/${id}/approve`, undefined, token);
  revalidatePath('/dashboard/stores');
  revalidatePath(`/dashboard/stores/${id}`);
  revalidatePath('/dashboard');
}

export async function rejectStoreAction(id: string, formData: FormData) {
  const { token } = await requireAdminUser();
  const reason = String(formData.get('reason') ?? '');
  await apiPatch(`/admin/stores/${id}/reject`, { reason }, token);
  revalidatePath('/dashboard/stores');
  revalidatePath(`/dashboard/stores/${id}`);
  revalidatePath('/dashboard');
}

export async function confirmStorePaymentAction(id: string) {
  const { token } = await requireAdminUser();
  await apiPatch(`/admin/stores/${id}/confirm-payment`, undefined, token);
  revalidatePath('/dashboard/stores');
  revalidatePath(`/dashboard/stores/${id}`);
}

export async function deleteStoreAction(id: string) {
  const { token } = await requireAdminUser();
  await apiDelete(`/stores/${id}`, token);
  revalidatePath('/dashboard/stores');
  redirect('/dashboard/stores');
}
