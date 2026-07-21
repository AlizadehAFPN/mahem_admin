'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiDelete, apiPatch } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';

export async function approveStoreOfferAction(id: string) {
  const { token } = await requireAdminUser();
  await apiPatch(`/admin/store-offers/${id}/approve`, undefined, token);
  revalidatePath('/dashboard/store-offers');
  revalidatePath(`/dashboard/store-offers/${id}`);
  revalidatePath('/dashboard');
}

export async function rejectStoreOfferAction(id: string, formData: FormData) {
  const { token } = await requireAdminUser();
  const reason = String(formData.get('reason') ?? '');
  await apiPatch(`/admin/store-offers/${id}/reject`, { reason }, token);
  revalidatePath('/dashboard/store-offers');
  revalidatePath(`/dashboard/store-offers/${id}`);
  revalidatePath('/dashboard');
}

export async function confirmStoreOfferPaymentAction(id: string) {
  const { token } = await requireAdminUser();
  await apiPatch(`/admin/store-offers/${id}/confirm-payment`, undefined, token);
  revalidatePath('/dashboard/store-offers');
  revalidatePath(`/dashboard/store-offers/${id}`);
}

export async function deleteStoreOfferAction(id: string) {
  const { token } = await requireAdminUser();
  await apiDelete(`/store-offers/${id}`, token);
  revalidatePath('/dashboard/store-offers');
  redirect('/dashboard/store-offers');
}
