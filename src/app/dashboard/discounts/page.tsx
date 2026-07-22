import Link from 'next/link';
import { Badge } from '@/components/badge';
import { Pagination } from '@/components/pagination';
import { RejectButton } from '@/components/reject-button';
import { apiGet } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import type { Advertisement, Category, Paginated } from '@/lib/types';
import { approveDiscountAction, rejectDiscountAction } from './actions';

function formatPrice(price: string | null) {
  if (!price) return '—';
  return `${Number(price).toLocaleString('fa-IR')} تومان`;
}

// تخفیف‌یاب ads are never tagged with the parent "تخفیف یاب" category
// itself — only with one of its subcategories (تخفیف آخر هفته، رستوران و
// کافی‌شاپ، ...) — so this resolves the parent's id and asks the backend
// for everything under it in one call (see parentCategoryId on
// FindAdvertisementsDto) rather than filtering to one exact category.
export default async function DiscountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { token } = await requireAdminUser();

  const categories = await apiGet<Category[]>('/categories', token);
  const discountCategory = categories.find(category => category.name === 'تخفیف یاب');

  const page = Number(params.page ?? '1');
  const approvalStatus = params.approvalStatus ?? '';
  const search = params.search ?? '';

  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', '20');
  if (discountCategory) query.set('parentCategoryId', discountCategory.id);
  if (approvalStatus) query.set('approvalStatus', approvalStatus);
  if (search) query.set('search', search);

  const result = discountCategory
    ? await apiGet<Paginated<Advertisement>>(`/admin/advertisements?${query.toString()}`, token)
    : { items: [], total: 0, page: 1, limit: 20 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">تخفیف یاب</h1>
        <p className="mt-1 text-sm text-gray-500">مدیریت و تایید آگهی‌های تخفیف‌یاب</p>
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
                <td className="px-4 py-3 text-gray-600">{ad.user?.username ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{ad.category?.name}</td>
                <td className="px-4 py-3 text-gray-600">{ad.city?.name}</td>
                <td className="px-4 py-3 text-gray-600">{formatPrice(ad.price)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <Badge value={ad.approvalStatus} />
                    {ad.approvalStatus === 'REJECTED' && ad.rejectionReason && (
                      <span className="text-xs text-gray-400">{ad.rejectionReason}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {ad.approvalStatus !== 'APPROVED' && (
                    <div className="flex gap-2">
                      <form action={approveDiscountAction.bind(null, ad.id)}>
                        <button
                          type="submit"
                          className="rounded-lg border border-green-300 px-3 py-1.5 text-sm text-green-700 transition hover:bg-green-50"
                        >
                          تایید
                        </button>
                      </form>
                      <RejectButton action={rejectDiscountAction.bind(null, ad.id)} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {result.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
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
        basePath="/dashboard/discounts"
        searchParams={{ approvalStatus, search }}
      />
    </div>
  );
}
