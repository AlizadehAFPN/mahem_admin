import { apiGet } from '@/lib/api';
import { requireSuperAdmin } from '@/lib/session';
import { BroadcastForm } from './broadcast-form';

export default async function NotificationsPage() {
  const { token } = await requireSuperAdmin();
  const stats = await apiGet<{ users: { total: number } }>('/admin/dashboard/stats', token);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">نوتیفیکیشن همگانی</h1>
        <p className="mt-1 text-sm text-gray-500">
          ارسال نوتیفیکیشن به تمام کاربران فعلی اپلیکیشن (اندروید و iOS)
        </p>
      </div>

      <BroadcastForm totalUsers={stats.users.total} />
    </div>
  );
}
