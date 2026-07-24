import { apiGet } from '@/lib/api';
import { requireSuperAdmin } from '@/lib/session';
import { ExpirySettingsForm } from './expiry-settings-form';

export default async function AdExpiryPage() {
  const { token } = await requireSuperAdmin();
  const setting = await apiGet<{ expiryDays: number | null }>(
    '/admin/ad-expiry-settings',
    token,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">تاریخ انقضا آگهی</h1>
        <p className="mt-1 text-sm text-gray-500">
          تعیین مدت اعتبار پیش‌فرض آگهی‌های جدید. برای تمدید یا آرشیو دستی یک آگهی مشخص، از
          صفحه جزییات همان آگهی استفاده کنید.
        </p>
      </div>

      <ExpirySettingsForm initialExpiryDays={setting.expiryDays} />
    </div>
  );
}
