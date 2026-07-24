import { apiGet } from '@/lib/api';
import { requireSuperAdmin } from '@/lib/session';
import { ExpirySettingsForm } from './expiry-settings-form';

export default async function StoreExpiryPage() {
  const { token } = await requireSuperAdmin();
  const setting = await apiGet<{ expiryDays: number | null }>(
    '/admin/store-expiry-settings',
    token,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">مدت اشتراک فروشگاه</h1>
        <p className="mt-1 text-sm text-gray-500">
          تعیین مدتی که هر بار تایید پرداخت (اولیه یا تمدید) اشتراک فروشگاه را تمدید می‌کند.
        </p>
      </div>

      <ExpirySettingsForm initialExpiryDays={setting.expiryDays} />
    </div>
  );
}
