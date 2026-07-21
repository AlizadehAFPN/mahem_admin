import Link from 'next/link';
import { Badge } from '@/components/badge';
import { DeleteButton } from '@/components/delete-button';
import { RejectButton } from '@/components/reject-button';
import { apiGet } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import type { StoreOffer } from '@/lib/types';
import {
  approveStoreOfferAction,
  confirmStoreOfferPaymentAction,
  deleteStoreOfferAction,
  rejectStoreOfferAction,
} from '../actions';

function formatPrice(price: string | null) {
  if (!price) return '—';
  return `${Number(price).toLocaleString('fa-IR')} تومان`;
}

export default async function StoreOfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { token } = await requireAdminUser();
  const offer = await apiGet<StoreOffer>(`/admin/store-offers/${id}`, token);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/store-offers" className="text-sm text-gray-500 hover:text-gray-700">
            ← بازگشت به لیست آگهی‌های تخفیف
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{offer.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge value={offer.approvalStatus} />
            <Badge value={offer.status} />
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                offer.paymentStatus === 'PAID'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {offer.paymentStatus === 'PAID' ? 'پرداخت‌شده' : 'در انتظار پرداخت'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {offer.paymentStatus !== 'PAID' && (
            <form action={confirmStoreOfferPaymentAction.bind(null, offer.id)}>
              <button
                type="submit"
                className="rounded-lg border border-blue-300 px-4 py-2 text-sm text-blue-700 transition hover:bg-blue-50"
              >
                تایید دریافت وجه
              </button>
            </form>
          )}
          {offer.approvalStatus !== 'APPROVED' && (
            <>
              <form action={approveStoreOfferAction.bind(null, offer.id)}>
                <button
                  type="submit"
                  className="rounded-lg border border-green-300 px-4 py-2 text-sm text-green-700 transition hover:bg-green-50"
                >
                  تایید
                </button>
              </form>
              <RejectButton action={rejectStoreOfferAction.bind(null, offer.id)} />
            </>
          )}
          <DeleteButton
            action={deleteStoreOfferAction.bind(null, offer.id)}
            confirmText={`آیا از حذف قطعی آگهی تخفیف «${offer.title}» مطمئن هستید؟`}
          />
        </div>
      </div>

      {offer.rejectionReason && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
          دلیل رد: {offer.rejectionReason}
        </div>
      )}

      {offer.images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {offer.images.map(url => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
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
            {offer.description || '—'}
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-3 text-sm font-semibold text-gray-500">اطلاعات</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">فروشگاه</dt>
              <dd className="font-medium text-gray-900">{offer.store?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">شهر</dt>
              <dd className="font-medium text-gray-900">{offer.city?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">مالک</dt>
              <dd className="font-medium text-gray-900">{offer.user?.username ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">درصد تخفیف</dt>
              <dd className="font-medium text-gray-900">
                {offer.discountPercent ? `٪${offer.discountPercent}` : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">قیمت اصلی</dt>
              <dd className="font-medium text-gray-900">{formatPrice(offer.originalPrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">اطلاعات تماس</dt>
              <dd className="font-medium text-gray-900" dir="ltr">
                {offer.contactInfo ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">پایان تخفیف</dt>
              <dd className="font-medium text-gray-900">
                {offer.expiresAt ? new Date(offer.expiresAt).toLocaleDateString('fa-IR') : '—'}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
