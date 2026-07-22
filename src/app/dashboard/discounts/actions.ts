'use server';

import { revalidatePath } from 'next/cache';
import { apiPatch } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';

// تخفیف‌یاب items are regular Advertisement rows (tagged with one of the
// تخفیف‌یاب subcategories), so this hits the exact same admin endpoints as
// /dashboard/advertisements — only the revalidated paths differ, since this
// is a separate list view.
export async function approveDiscountAction(id: string) {
  const { token } = await requireAdminUser();
  await apiPatch(`/admin/advertisements/${id}/approve`, undefined, token);
  revalidatePath('/dashboard/discounts');
  revalidatePath(`/dashboard/advertisements/${id}`);
  revalidatePath('/dashboard');
}

export async function rejectDiscountAction(id: string, formData: FormData) {
  const { token } = await requireAdminUser();
  const reason = String(formData.get('reason') ?? '');
  await apiPatch(`/admin/advertisements/${id}/reject`, { reason }, token);
  revalidatePath('/dashboard/discounts');
  revalidatePath(`/dashboard/advertisements/${id}`);
  revalidatePath('/dashboard');
}
