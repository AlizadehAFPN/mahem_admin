import { apiGet } from '@/lib/api';
import { requireSuperAdmin } from '@/lib/session';
import { ExpirySettingsForm } from './expiry-settings-form';

export default async function JobExpiryPage() {
  const { token } = await requireSuperAdmin();
  const setting = await apiGet<{ expiryDays: number | null }>(
    '/admin/job-expiry-settings',
    token,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">تاریخ انقضا آگهی استخدام</h1>
        <p className="mt-1 text-sm text-gray-500">
          تعیین مدت اعتبار آگهی‌های استخدام جدید، و مدتی که هر تمدید به آن اضافه می‌کند.
        </p>
      </div>

      <ExpirySettingsForm initialExpiryDays={setting.expiryDays} />
    </div>
  );
}
