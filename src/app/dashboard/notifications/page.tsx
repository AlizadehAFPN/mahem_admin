import { apiGet } from '@/lib/api';
import { requireSuperAdmin } from '@/lib/session';
import type { City } from '@/lib/types';
import { BroadcastForm } from './broadcast-form';
import { TestPushButton } from './test-push-button';

export default async function NotificationsPage() {
  const { token } = await requireSuperAdmin();
  const [stats, cities] = await Promise.all([
    apiGet<{ users: { total: number } }>('/admin/dashboard/stats', token),
    apiGet<City[]>('/cities', token),
  ]);
  const cityOptions = cities.map(city => ({ value: city.id, label: city.name }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">نوتیفیکیشن همگانی</h1>
        <p className="mt-1 text-sm text-gray-500">
          ارسال نوتیفیکیشن به همه کاربران یا فقط کاربران یک شهر مشخص (اندروید و iOS)
        </p>
      </div>

      <TestPushButton />
      <BroadcastForm totalUsers={stats.users.total} cityOptions={cityOptions} />
    </div>
  );
}
