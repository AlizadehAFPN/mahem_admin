import Link from 'next/link';
import { Badge } from '@/components/badge';
import { DeleteButton } from '@/components/delete-button';
import { RejectButton } from '@/components/reject-button';
import { apiGet } from '@/lib/api';
import { proxiedImageUrl } from '@/lib/image';
import { requireAdminUser } from '@/lib/session';
import type { Store } from '@/lib/types';
import {
  approveStoreAction,
  confirmStorePaymentAction,
  deleteStoreAction,
  rejectStoreAction,
} from '../actions';

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { token } = await requireAdminUser();
  const store = await apiGet<Store>(`/admin/stores/${id}`, token);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/stores" className="text-sm text-gray-500 hover:text-gray-700">
            ← بازگشت به لیست فروشگاه‌ها
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{store.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge value={store.approvalStatus} />
            <Badge value={store.status} />
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                store.paymentStatus === 'PAID'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {store.paymentStatus === 'PAID' ? 'پرداخت‌شده' : 'در انتظار پرداخت'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {store.paymentStatus !== 'PAID' && (
            <form action={confirmStorePaymentAction.bind(null, store.id)}>
              <button
                type="submit"
                className="rounded-lg border border-blue-300 px-4 py-2 text-sm text-blue-700 transition hover:bg-blue-50"
              >
                تایید دریافت وجه
              </button>
            </form>
          )}
          {store.approvalStatus !== 'APPROVED' && (
            <>
              <form action={approveStoreAction.bind(null, store.id)}>
                <button
                  type="submit"
                  className="rounded-lg border border-green-300 px-4 py-2 text-sm text-green-700 transition hover:bg-green-50"
                >
                  تایید
                </button>
              </form>
              <RejectButton action={rejectStoreAction.bind(null, store.id)} />
            </>
          )}
          <DeleteButton
            action={deleteStoreAction.bind(null, store.id)}
            confirmText={`آیا از حذف قطعی فروشگاه «${store.name}» مطمئن هستید؟ این عمل قابل بازگشت نیست.`}
          />
        </div>
      </div>

      {store.rejectionReason && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
          دلیل رد: {store.rejectionReason}
        </div>
      )}

      {store.images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {store.images.map(url => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={proxiedImageUrl(url)}
              alt=""
              className="h-40 w-full rounded-xl object-cover ring-1 ring-gray-200"
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-gray-500">توضیحات</h2>
          <p className="whitespace-pre-wrap text-sm text-gray-800">
            {store.description || '—'}
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-3 text-sm font-semibold text-gray-500">اطلاعات</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">دسته‌بندی</dt>
              <dd className="font-medium text-gray-900">{store.category?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">شهر</dt>
              <dd className="font-medium text-gray-900">{store.city?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">مالک</dt>
              <dd className="font-medium text-gray-900">{store.user?.username ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">تلفن</dt>
              <dd className="font-medium text-gray-900" dir="ltr">
                {store.phone ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">آدرس</dt>
              <dd className="font-medium text-gray-900">{store.address ?? '—'}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
