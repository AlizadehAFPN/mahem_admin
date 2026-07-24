import Link from 'next/link';
import { Badge } from '@/components/badge';
import { Pagination } from '@/components/pagination';
import { RejectButton } from '@/components/reject-button';
import { apiGet } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import type { Advertisement, Category, Paginated } from '@/lib/types';
import {
  approveAdvertisementAction,
  confirmAdvertisementPaymentAction,
  rejectAdvertisementAction,
} from './actions';

function formatPrice(price: string | null) {
  if (!price) return '—';
  return `${Number(price).toLocaleString('fa-IR')} تومان`;
}

export default async function AdvertisementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { token } = await requireAdminUser();

  const page = Number(params.page ?? '1');
  const approvalStatus = params.approvalStatus ?? '';
  const status = params.status ?? '';
  const search = params.search ?? '';

  // تخفیف‌یاب ads have their own dedicated moderation page now
  // (/dashboard/discounts) — exclude them here so they aren't moderated
  // twice from two different lists.
  const categories = await apiGet<Category[]>('/categories', token);
  const discountCategory = categories.find(category => category.name === 'تخفیف یاب');

  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', '20');
  if (approvalStatus) query.set('approvalStatus', approvalStatus);
  if (status) query.set('status', status);
  if (search) query.set('search', search);
  if (discountCategory) query.set('excludeParentCategoryId', discountCategory.id);

  const result = await apiGet<Paginated<Advertisement>>(
    `/admin/advertisements?${query.toString()}`,
    token,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">آگهی‌ها</h1>
        <p className="mt-1 text-sm text-gray-500">مدیریت و تایید آگهی‌های ثبت‌شده در اپلیکیشن</p>
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
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">آرشیو</label>
          <select
            name="status"
            defaultValue={status}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">همه</option>
            <option value="ACTIVE">فعال</option>
            <option value="INACTIVE">غیرفعال</option>
            <option value="ARCHIVED">آرشیو شده</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs font-medium text-gray-500">جستجو</label>
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="عنوان یا توضیحات آگهی"
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
              <th className="px-4 py-3">قیمت</th>
              <th className="px-4 py-3">وضعیت</th>
              <th className="px-4 py-3">پرداخت</th>
              <th className="px-4 py-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map(ad => (
              <tr key={ad.id} className="border-b border-gray-100 last:border-0">
                <td className="max-w-[220px] truncate px-4 py-3 font-medium text-gray-900">
                  <Link href={`/dashboard/advertisements/${ad.id}`} className="hover:underline">
                    {ad.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600" dir={!ad.user?.username && ad.store?.name ? undefined : 'ltr'}>
                  {ad.user?.username ?? ad.store?.name ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">{ad.category?.name}</td>
                <td className="px-4 py-3 text-gray-600">{ad.city?.name}</td>
                <td className="px-4 py-3 text-gray-600">{formatPrice(ad.price)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap gap-1">
                      <Badge value={ad.approvalStatus} />
                      <Badge value={ad.status} />
                    </div>
                    {ad.approvalStatus === 'REJECTED' && ad.rejectionReason && (
                      <span className="text-xs text-gray-400">{ad.rejectionReason}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {ad.paymentStatus && (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        ad.paymentStatus === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ad.paymentStatus === 'PAID' ? 'پرداخت‌شده' : 'در انتظار پرداخت'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {ad.paymentStatus === 'PENDING' && (
                      <form action={confirmAdvertisementPaymentAction.bind(null, ad.id)}>
                        <button
                          type="submit"
                          className="rounded-lg border border-blue-300 px-3 py-1.5 text-sm text-blue-700 transition hover:bg-blue-50"
                        >
                          تایید پرداخت
                        </button>
                      </form>
                    )}
                    {ad.approvalStatus !== 'APPROVED' && (
                      <>
                        <form action={approveAdvertisementAction.bind(null, ad.id)}>
                          <button
                            type="submit"
                            className="rounded-lg border border-green-300 px-3 py-1.5 text-sm text-green-700 transition hover:bg-green-50"
                          >
                            تایید
                          </button>
                        </form>
                        <RejectButton action={rejectAdvertisementAction.bind(null, ad.id)} />
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
        basePath="/dashboard/advertisements"
        searchParams={{ approvalStatus, status, search }}
      />
    </div>
  );
}
