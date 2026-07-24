import Link from 'next/link';
import { Badge } from '@/components/badge';
import { Pagination } from '@/components/pagination';
import { RejectButton } from '@/components/reject-button';
import { apiGet } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import type { Job, Paginated } from '@/lib/types';
import { approveJobAction, confirmJobPaymentAction, rejectJobAction } from './actions';

function formatSalary(salary: string | null) {
  if (!salary) return '—';
  return `${Number(salary).toLocaleString('fa-IR')} تومان`;
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { token } = await requireAdminUser();

  const page = Number(params.page ?? '1');
  const approvalStatus = params.approvalStatus ?? '';
  const search = params.search ?? '';

  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', '20');
  if (approvalStatus) query.set('approvalStatus', approvalStatus);
  if (search) query.set('search', search);

  const result = await apiGet<Paginated<Job>>(`/admin/jobs?${query.toString()}`, token);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">مشاغل</h1>
        <p className="mt-1 text-sm text-gray-500">مدیریت و تایید آگهی‌های استخدام ثبت‌شده در اپلیکیشن</p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">وضعیت</label>
          <select
            name="approvalStatus"
            defaultValue={approvalStatus}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">همه</option>
            <option value="PENDING">در انتظار تایید</option>
            <option value="APPROVED">تایید شده</option>
            <option value="REJECTED">رد شده</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs font-medium text-gray-500">جستجو</label>
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="عنوان یا توضیحات شغل"
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
              <th className="px-4 py-3">عنوان</th>
              <th className="px-4 py-3">مالک</th>
              <th className="px-4 py-3">دسته‌بندی</th>
              <th className="px-4 py-3">شهر</th>
              <th className="px-4 py-3">حقوق</th>
              <th className="px-4 py-3">وضعیت</th>
              <th className="px-4 py-3">پرداخت</th>
              <th className="px-4 py-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map(job => (
              <tr key={job.id} className="border-b border-gray-100 last:border-0">
                <td className="max-w-[220px] truncate px-4 py-3 font-medium text-gray-900">
                  <Link href={`/dashboard/jobs/${job.id}`} className="hover:underline">
                    {job.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600" dir="ltr">
                  {job.user?.username ?? job.user?.mobile ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">{job.category?.name}</td>
                <td className="px-4 py-3 text-gray-600">{job.city?.name}</td>
                <td className="px-4 py-3 text-gray-600">{formatSalary(job.salary)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <Badge value={job.approvalStatus} />
                    {job.approvalStatus === 'REJECTED' && job.rejectionReason && (
                      <span className="text-xs text-gray-400">{job.rejectionReason}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      job.paymentStatus === 'PAID'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {job.paymentStatus === 'PAID' ? 'پرداخت‌شده' : 'در انتظار پرداخت'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {job.paymentStatus !== 'PAID' && (
                      <form action={confirmJobPaymentAction.bind(null, job.id)}>
                        <button
                          type="submit"
                          className="rounded-lg border border-blue-300 px-3 py-1.5 text-sm text-blue-700 transition hover:bg-blue-50"
                        >
                          تایید پرداخت
                        </button>
                      </form>
                    )}
                    {job.approvalStatus !== 'APPROVED' && (
                      <>
                        <form action={approveJobAction.bind(null, job.id)}>
                          <button
                            type="submit"
                            className="rounded-lg border border-green-300 px-3 py-1.5 text-sm text-green-700 transition hover:bg-green-50"
                          >
                            تایید
                          </button>
                        </form>
                        <RejectButton action={rejectJobAction.bind(null, job.id)} />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {result.items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
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
        basePath="/dashboard/jobs"
        searchParams={{ approvalStatus, search }}
      />
    </div>
  );
}
