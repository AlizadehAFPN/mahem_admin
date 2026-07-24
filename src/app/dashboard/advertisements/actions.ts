'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiDelete, apiPatch } from '@/lib/api';
import { requireAdminUser, requireSuperAdmin } from '@/lib/session';

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

// Confirms the one-off posting fee for ads under a fee-required category
// (استخدامی/تخفیف‌یاب — see Category.adFeeToman) after a manual bank
// transfer — same pattern as confirmStorePaymentAction, but not a
// subscription (no expiry date to push out).
export async function confirmAdvertisementPaymentAction(id: string) {
  const { token } = await requireAdminUser();
  await apiPatch(`/admin/advertisements/${id}/confirm-payment`, undefined, token);
  revalidatePath('/dashboard/advertisements');
  revalidatePath(`/dashboard/advertisements/${id}`);
}

// Hits the plain (non-admin-prefixed) endpoint — its ownership check already
// bypasses for ADMIN/SUPER_ADMIN, so no separate admin route was needed.
export async function deleteAdvertisementAction(id: string) {
  const { token } = await requireAdminUser();
  await apiDelete(`/advertisements/${id}`, token);
  revalidatePath('/dashboard/advertisements');
  redirect('/dashboard/advertisements');
}

// SUPER_ADMIN-only: manually pushes (or sets) this ad's expiry date — see
// AdExpirySetting for the global default new ads get instead.
export async function setAdvertisementExpiryAction(id: string, formData: FormData) {
  const { token } = await requireSuperAdmin();
  const expiresAt = String(formData.get('expiresAt') ?? '');
  await apiPatch(`/admin/advertisements/${id}/expiry`, { expiresAt }, token);
  revalidatePath('/dashboard/advertisements');
  revalidatePath(`/dashboard/advertisements/${id}`);
}

// SUPER_ADMIN-only: archives an ad immediately, independent of its expiresAt.
export async function archiveAdvertisementAction(id: string) {
  const { token } = await requireSuperAdmin();
  await apiPatch(`/admin/advertisements/${id}/archive`, undefined, token);
  revalidatePath('/dashboard/advertisements');
  revalidatePath(`/dashboard/advertisements/${id}`);
}
