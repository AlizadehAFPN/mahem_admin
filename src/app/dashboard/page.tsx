import Link from 'next/link';
import { StatCard } from '@/components/stat-card';
import { apiGet } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import type { DashboardStats } from '@/lib/types';

export default async function DashboardPage() {
  const { token } = await requireAdminUser();
  const stats = await apiGet<DashboardStats>('/admin/dashboard/stats', token);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">داشبورد</h1>
        <p className="mt-1 text-sm text-gray-500">نمای کلی از وضعیت ماهم</p>
      </div>

      {/* آگهی / مشاغل / تخفیف یاب / گزارش — one card per moderation queue,
          each linking to the page that actually holds those items. تخفیف‌یاب
          ads are excluded from the آگهی‌ها count (they live on
          /dashboard/discounts), so the two cards never double-count. */}
      <section>
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="text-sm font-semibold text-gray-500">در انتظار بررسی</h2>
          <span className="text-xs text-gray-400">
            مجموع: {stats.pendingReview.total}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/dashboard/advertisements?approvalStatus=PENDING">
            <StatCard label="آگهی‌ها" value={stats.pendingReview.advertisements} accent="warning" />
          </Link>
          <Link href="/dashboard/jobs?approvalStatus=PENDING">
            <StatCard label="مشاغل" value={stats.pendingReview.jobs} accent="warning" />
          </Link>
          <Link href="/dashboard/discounts?approvalStatus=PENDING">
            <StatCard label="تخفیف یاب" value={stats.pendingReview.discounts} accent="warning" />
          </Link>
          <Link href="/dashboard/reports?status=PENDING">
            <StatCard label="گزارش‌ها" value={stats.pendingReview.reports} accent="warning" />
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-500">آمار کلی</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="کل آگهی‌ها" value={stats.listings.advertisements} />
          <StatCard label="کل مشاغل" value={stats.listings.jobs} />
          <StatCard label="کل تخفیف‌یاب" value={stats.listings.discounts} />
          <StatCard label="کل فروشگاه‌ها" value={stats.listings.stores} />
          <StatCard label="کل کاربران" value={stats.users.total} />
          <StatCard label="ادمین‌ها" value={stats.users.admins} />
        </div>
      </section>
    </div>
  );
}
