import Link from 'next/link';
import { Badge } from '@/components/badge';
import { Pagination } from '@/components/pagination';
import { apiGet } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import type { Paginated, Report } from '@/lib/types';
import { markReportStatusAction } from './actions';

const categoryLabels: Record<string, string> = {
  CATEGORY_PROBLEM: 'دسته بندی نامناسب',
  CONTENT_PROBLEM: 'محتوی آگهی نامناسب',
  PRICE_PROBLEM: 'قیمت آگهی نامناسب',
  CALL_INFO_PROBLEM: 'شماره تماس نادرست',
  EXISTENCY_PROBLEM: 'محصول دیگر موجود نیست',
  OTHER: 'دیگر',
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { token } = await requireAdminUser();

  const page = Number(params.page ?? '1');
  const status = params.status ?? '';

  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', '20');
  if (status) query.set('status', status);

  const result = await apiGet<Paginated<Report>>(`/admin/reports?${query.toString()}`, token);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">گزارش‌های آگهی</h1>
        <p className="mt-1 text-sm text-gray-500">
          گزارش‌های ثبت‌شده توسط کاربران درباره مشکل آگهی‌ها
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">وضعیت</label>
          <select
            name="status"
            defaultValue={status}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">همه</option>
            <option value="PENDING">در انتظار بررسی</option>
            <option value="REVIEWED">بررسی شده</option>
            <option value="DISMISSED">رد شده (بی‌مورد)</option>
          </select>
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
              <th className="px-4 py-3">آگهی</th>
              <th className="px-4 py-3">نوع مشکل</th>
              <th className="px-4 py-3">توضیحات</th>
              <th className="px-4 py-3">گزارش‌دهنده</th>
              <th className="px-4 py-3">وضعیت</th>
              <th className="px-4 py-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map(report => (
              <tr key={report.id} className="border-b border-gray-100 last:border-0">
                <td className="max-w-[200px] truncate px-4 py-3 font-medium text-gray-900">
                  <Link
                    href={`/dashboard/advertisements/${report.advertisementId}`}
                    className="hover:underline"
                  >
                    {report.advertisement?.title ?? '—'}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {categoryLabels[report.category] ?? report.category}
                </td>
                <td className="max-w-[240px] truncate px-4 py-3 text-gray-600">
                  {report.description ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-600" dir="ltr">
                  {report.reporter?.mobile}
                </td>
                <td className="px-4 py-3">
                  <Badge value={report.status} />
                </td>
                <td className="px-4 py-3">
                  {report.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <form action={markReportStatusAction.bind(null, report.id, 'REVIEWED')}>
                        <button
                          type="submit"
                          className="rounded-lg border border-green-300 px-3 py-1.5 text-sm text-green-700 transition hover:bg-green-50"
                        >
                          بررسی شد
                        </button>
                      </form>
                      <form action={markReportStatusAction.bind(null, report.id, 'DISMISSED')}>
                        <button
                          type="submit"
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
                        >
                          بی‌مورد
                        </button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {result.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  گزارشی ثبت نشده است
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
        basePath="/dashboard/reports"
        searchParams={{ status }}
      />
    </div>
  );
}
