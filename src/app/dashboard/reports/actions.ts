'use server';

import { revalidatePath } from 'next/cache';
import { apiPatch } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';

export async function markReportStatusAction(id: string, status: 'REVIEWED' | 'DISMISSED') {
  const { token } = await requireAdminUser();
  await apiPatch(`/admin/reports/${id}`, { status }, token);
  revalidatePath('/dashboard/reports');
  revalidatePath('/dashboard');
}
