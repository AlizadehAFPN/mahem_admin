'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiDelete, apiPatch } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';

export async function approveStoreAction(id: string) {
  const { token } = await requireAdminUser();
  await apiPatch(`/admin/stores/${id}/approve`, undefined, token);
  revalidatePath('/dashboard/stores');
  revalidatePath('/dashboard');
}

export async function rejectStoreAction(id: string, formData: FormData) {
  const { token } = await requireAdminUser();
  const reason = String(formData.get('reason') ?? '');
  await apiPatch(`/admin/stores/${id}/reject`, { reason }, token);
  revalidatePath('/dashboard/stores');
  revalidatePath('/dashboard');
}

// Confirms the store's current pending payment (initial subscription or a
// "تمدید فروشگاه" renewal request from the app) — the backend pushes
// subscriptionExpiresAt 30 days out from whichever is later: today, or the
// store's existing expiry.
export async function confirmStorePaymentAction(id: string) {
  const { token } = await requireAdminUser();
  await apiPatch(`/admin/stores/${id}/confirm-payment`, undefined, token);
  revalidatePath('/dashboard/stores');
}

// Deletes the storefront for good, together with every discount ad posted
// under it — the backend does that cascade in one transaction (see
// StoresService.remove). Hits the plain (non-admin-prefixed) endpoint, whose
// ownership check already bypasses for ADMIN/SUPER_ADMIN — same as
// deleteAdvertisementAction.
export async function deleteStoreAction(id: string) {
  const { token } = await requireAdminUser();
  await apiDelete(`/stores/${id}`, token);
  revalidatePath('/dashboard/stores');
  revalidatePath('/dashboard/advertisements');
  revalidatePath('/dashboard');
  redirect('/dashboard/stores');
}
