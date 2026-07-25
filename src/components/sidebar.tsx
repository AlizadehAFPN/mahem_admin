'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/lib/logout-action';
import type { AdminUser } from '@/lib/types';

const navItems = [
  { href: '/dashboard', label: 'داشبورد', icon: '📊' },
  { href: '/dashboard/analytics', label: 'آمار و گزارش بازدید', icon: '📈' },
  { href: '/dashboard/advertisements', label: 'آگهی‌ها', icon: '🏷️' },
  { href: '/dashboard/discounts', label: 'تخفیف یاب', icon: '🏷️' },
  { href: '/dashboard/stores', label: 'فروشگاه‌ها', icon: '🏪' },
  { href: '/dashboard/jobs', label: 'مشاغل', icon: '💼' },
  { href: '/dashboard/reports', label: 'گزارش‌ها', icon: '🚩' },
  { href: '/dashboard/conversations', label: 'مکالمات', icon: '💬' },
  { href: '/dashboard/users', label: 'کاربران', icon: '👥' },
  { href: '/dashboard/notifications', label: 'نوتیفیکیشن همگانی', icon: '🔔', superAdminOnly: true },
  { href: '/dashboard/cities', label: 'شهرها', icon: '📍' },
  { href: '/dashboard/categories', label: 'دسته‌بندی‌ها', icon: '🗂️' },
  { href: '/dashboard/attribute-options', label: 'فیلدهای اختصاصی آگهی', icon: '⚙️' },
  { href: '/dashboard/banners', label: 'بنرها', icon: '🖼️' },
  { href: '/dashboard/splash-screens', label: 'تصویر اسپلش', icon: '📱' },
  { href: '/dashboard/app-settings', label: 'محتوای اپ', icon: '📝' },
  { href: '/dashboard/ad-expiry', label: 'تاریخ انقضا آگهی', icon: '⏳', superAdminOnly: true },
  { href: '/dashboard/store-expiry', label: 'مدت اشتراک فروشگاه', icon: '⏳', superAdminOnly: true },
  { href: '/dashboard/job-expiry', label: 'تاریخ انقضا آگهی استخدام', icon: '⏳', superAdminOnly: true },
];

export function Sidebar({ user }: { user: AdminUser }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-l border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <span className="text-lg font-bold text-gray-900">ماهم ادمین</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems
          .filter(item => !item.superAdminOnly || user.role === 'SUPER_ADMIN')
          .map(item => {
          const isActive =
            item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="mb-3 text-sm">
          <p className="font-medium text-gray-900" dir="ltr">
            {user.mobile}
          </p>
          <p className="text-gray-500">
            {user.role === 'SUPER_ADMIN' ? 'سوپر ادمین' : 'ادمین'}
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            خروج
          </button>
        </form>
      </div>
    </aside>
  );
}
