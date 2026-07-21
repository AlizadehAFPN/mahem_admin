'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiDelete, apiPatch } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';

export async function approveJobAction(id: string) {
  const { token } = await requireAdminUser();
  await apiPatch(`/admin/jobs/${id}/approve`, undefined, token);
  revalidatePath('/dashboard/jobs');
  revalidatePath(`/dashboard/jobs/${id}`);
  revalidatePath('/dashboard');
}

export async function rejectJobAction(id: string, formData: FormData) {
  const { token } = await requireAdminUser();
  const reason = String(formData.get('reason') ?? '');
  await apiPatch(`/admin/jobs/${id}/reject`, { reason }, token);
  revalidatePath('/dashboard/jobs');
  revalidatePath(`/dashboard/jobs/${id}`);
  revalidatePath('/dashboard');
}

export async function confirmJobPaymentAction(id: string) {
  const { token } = await requireAdminUser();
  await apiPatch(`/admin/jobs/${id}/confirm-payment`, undefined, token);
  revalidatePath('/dashboard/jobs');
  revalidatePath(`/dashboard/jobs/${id}`);
}

export async function deleteJobAction(id: string) {
  const { token } = await requireAdminUser();
  await apiDelete(`/jobs/${id}`, token);
  revalidatePath('/dashboard/jobs');
  redirect('/dashboard/jobs');
}
