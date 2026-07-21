'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiDelete, apiPatch } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';

export async function approveAdvertisementAction(id: string) {
  const { token } = await requireAdminUser();
  await apiPatch(`/admin/advertisements/${id}/approve`, undefined, token);
  revalidatePath('/dashboard/advertisements');
  revalidatePath(`/dashboard/advertisements/${id}`);
  revalidatePath('/dashboard');
}

export async function rejectAdvertisementAction(id: string, formData: FormData) {
  const { token } = await requireAdminUser();
  const reason = String(formData.get('reason') ?? '');
  await apiPatch(`/admin/advertisements/${id}/reject`, { reason }, token);
  revalidatePath('/dashboard/advertisements');
  revalidatePath(`/dashboard/advertisements/${id}`);
  revalidatePath('/dashboard');
}

// Hits the plain (non-admin-prefixed) endpoint — its ownership check already
// bypasses for ADMIN/SUPER_ADMIN, so no separate admin route was needed.
export async function deleteAdvertisementAction(id: string) {
  const { token } = await requireAdminUser();
  await apiDelete(`/advertisements/${id}`, token);
  revalidatePath('/dashboard/advertisements');
  redirect('/dashboard/advertisements');
}
