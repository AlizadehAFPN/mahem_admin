import { Badge } from '@/components/badge';
import { Pagination } from '@/components/pagination';
import { RoleSelect } from '@/components/role-select';
import { apiGet } from '@/lib/api';
import { proxiedImageUrl } from '@/lib/image';
import { requireAdminUser } from '@/lib/session';
import type { AdminUser, Paginated } from '@/lib/types';
import { updateUserRoleAction } from './actions';
import { DeleteUserButton } from './delete-user-button';
import { UserDevicesModal } from './user-devices-modal';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { user: viewer, token } = await requireAdminUser();

  const page = Number(params.page ?? '1');
  const role = params.role ?? '';
  const search = params.search ?? '';

  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', '20');
  if (role) query.set('role', role);
  if (search) query.set('search', search);

  const result = await apiGet<Paginated<AdminUser>>(`/admin/users?${query.toString()}`, token);
  const isSuperAdmin = viewer.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">کاربران</h1>
        <p className="mt-1 text-sm text-gray-500">
          مشاهده کاربران اپلیکیشن{isSuperAdmin ? ' و مدیریت سطح دسترسی آن‌ها' : ''}
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">نقش</label>
          <select
            name="role"
            defaultValue={role}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">همه</option>
            <option value="USER">کاربر</option>
            <option value="ADMIN">ادمین</option>
            <option value="SUPER_ADMIN">سوپر ادمین</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs font-medium text-gray-500">جستجو</label>
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="شماره موبایل یا نام کاربری"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          اعمال فیلتر
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500">
            <tr>
              <th className="px-4 py-3">عکس</th>
              <th className="px-4 py-3">موبایل</th>
              <th className="px-4 py-3">نام کاربری</th>
              <th className="px-4 py-3">شهر</th>
              <th className="px-4 py-3">آگهی / فروشگاه / شغل</th>
              <th className="px-4 py-3">نقش</th>
              <th className="px-4 py-3">دستگاه‌ها / نوتیفیکیشن</th>
              {isSuperAdmin && <th className="px-4 py-3">تغییر نقش</th>}
              {isSuperAdmin && <th className="px-4 py-3">حذف</th>}
            </tr>
          </thead>
          <tbody>
            {result.items.map(u => (
              <tr key={u.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3">
                  {u.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={proxiedImageUrl(u.avatar)}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover ring-1 ring-gray-200"
                    />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm text-gray-400">
                      👤
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900" dir="ltr">
                  {u.mobile}
                </td>
                <td className="px-4 py-3 text-gray-600">{u.username ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{u.city?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">
                  {u._count.advertisements} / {u._count.stores} / {u._count.jobs}
                </td>
                <td className="px-4 py-3">
                  <Badge value={u.role} />
                </td>
                <td className="px-4 py-3">
                  <UserDevicesModal
                    userId={u.id}
                    userLabel={u.username ?? u.mobile}
                    deviceCount={u._count.deviceTokens}
                    canSendNotification={isSuperAdmin}
                  />
                </td>
                {isSuperAdmin && (
                  <td className="px-4 py-3">
                    <RoleSelect
                      currentRole={u.role}
                      action={updateUserRoleAction.bind(null, u.id)}
                    />
                  </td>
                )}
                {isSuperAdmin && (
                  <td className="px-4 py-3">
                    {u.id === viewer.id || u.role === 'SUPER_ADMIN' ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : (
                      <DeleteUserButton
                        userId={u.id}
                        userMobile={u.mobile}
                        userLabel={u.username ?? u.mobile}
                      />
                    )}
                  </td>
                )}
              </tr>
            ))}
            {result.items.length === 0 && (
              <tr>
                <td colSpan={isSuperAdmin ? 9 : 7} className="px-4 py-10 text-center text-gray-400">
                  موردی یافت نشد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={result.page}
        limit={result.limit}
        total={result.total}
        basePath="/dashboard/users"
        searchParams={{ role, search }}
      />
    </div>
  );
}
