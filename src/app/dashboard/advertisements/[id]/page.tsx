import Link from 'next/link';
import { AdLocationMap } from '@/components/ad-location-map';
import { ArchiveButton } from '@/components/archive-button';
import { Badge } from '@/components/badge';
import { DeleteButton } from '@/components/delete-button';
import { RejectButton } from '@/components/reject-button';
import { SetExpiryButton } from '@/components/set-expiry-button';
import { apiGet } from '@/lib/api';
import { proxiedImageUrl } from '@/lib/image';
import { requireAdminUser } from '@/lib/session';
import type { Advertisement } from '@/lib/types';
import {
  approveAdvertisementAction,
  archiveAdvertisementAction,
  confirmAdvertisementPaymentAction,
  deleteAdvertisementAction,
  rejectAdvertisementAction,
  setAdvertisementExpiryAction,
} from '../actions';

function formatPrice(price: string | null) {
  if (!price) return '—';
  return `${Number(price).toLocaleString('fa-IR')} تومان`;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fa-IR');
}

// Persian labels for attribute keys the mobile app is known to send (see
// mahem's src/utiles/translations.ts and CommonForm/ContactInfoCard) — any
// other/unrecognized key still falls back to its raw name so nothing is
// ever silently hidden.
const ATTRIBUTE_LABELS: Record<string, string> = {
  education: 'میزان تحصیلات',
  degree: 'میزان تحصیلات',
  contractType: 'نوع قرارداد',
  contract_type: 'نوع قرارداد',
  ad_type: 'نوع آگهی',
  email: 'ایمیل',
  chatEnabled: 'چت فعال است',
  hideEmail: 'ایمیل در آگهی مخفی شود',
  brand: 'برند',
  area: 'مساحت',
};

function formatAttributeValue(key: string, value: unknown) {
  if (typeof value === 'boolean') {
    return value ? 'بله' : 'خیر';
  }
  if (key === 'email' && typeof value === 'string' && value) {
    return (
      <a href={`mailto:${value}`} className="text-blue-600 hover:underline" dir="ltr">
        {value}
      </a>
    );
  }
  return String(value);
}

export default async function AdvertisementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, token } = await requireAdminUser();
  const ad = await apiGet<Advertisement>(`/admin/advertisements/${id}`, token);

  const attributeEntries = ad.attributes ? Object.entries(ad.attributes) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/advertisements" className="text-sm text-gray-500 hover:text-gray-700">
            ← بازگشت به لیست آگهی‌ها
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{ad.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge value={ad.approvalStatus} />
            <Badge value={ad.status} />
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
          </div>
        </div>
        <div className="flex gap-2">
          {ad.paymentStatus === 'PENDING' && (
            <form action={confirmAdvertisementPaymentAction.bind(null, ad.id)}>
              <button
                type="submit"
                className="rounded-lg border border-blue-300 px-4 py-2 text-sm text-blue-700 transition hover:bg-blue-50"
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
                  className="rounded-lg border border-green-300 px-4 py-2 text-sm text-green-700 transition hover:bg-green-50"
                >
                  تایید
                </button>
              </form>
              <RejectButton action={rejectAdvertisementAction.bind(null, ad.id)} />
            </>
          )}
          {user.role === 'SUPER_ADMIN' && (
            <>
              <SetExpiryButton
                action={setAdvertisementExpiryAction.bind(null, ad.id)}
                currentExpiresAt={ad.expiresAt}
              />
              {ad.status !== 'ARCHIVED' && (
                <ArchiveButton
                  action={archiveAdvertisementAction.bind(null, ad.id)}
                  confirmText={`آیا از آرشیو کردن آگهی «${ad.title}» مطمئن هستید؟ این آگهی از فهرست عمومی مخفی خواهد شد.`}
                />
              )}
            </>
          )}
          <DeleteButton
            action={deleteAdvertisementAction.bind(null, ad.id)}
            confirmText={`آیا از حذف قطعی آگهی «${ad.title}» مطمئن هستید؟ این عمل قابل بازگشت نیست.`}
          />
        </div>
      </div>

      {ad.rejectionReason && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
          دلیل رد: {ad.rejectionReason}
        </div>
      )}

      {ad.images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ad.images.map(url => (
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

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-3 text-sm font-semibold text-gray-500">موقعیت مکانی</h2>
        {ad.lat != null && ad.lng != null ? (
          <AdLocationMap lat={ad.lat} lng={ad.lng} />
        ) : (
          <p className="text-sm text-gray-400">موقعیتی برای این آگهی ثبت نشده است</p>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-3 text-sm font-semibold text-gray-500">توضیحات</h2>
            <p className="whitespace-pre-wrap text-sm text-gray-800">{ad.description}</p>
          </section>

          {attributeEntries.length > 0 && (
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <h2 className="mb-3 text-sm font-semibold text-gray-500">
                ویژگی‌های اختصاصی دسته‌بندی
              </h2>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {attributeEntries.map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b border-gray-100 py-1.5 text-sm">
                    <dt className="text-gray-500" dir={ATTRIBUTE_LABELS[key] ? undefined : 'ltr'}>
                      {ATTRIBUTE_LABELS[key] ?? key}
                    </dt>
                    <dd className="font-medium text-gray-900">
                      {formatAttributeValue(key, value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-3 text-sm font-semibold text-gray-500">اطلاعات</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">قیمت</dt>
                <dd className="font-medium text-gray-900">{formatPrice(ad.price)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">دسته‌بندی</dt>
                <dd className="font-medium text-gray-900">{ad.category?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">شهر</dt>
                <dd className="font-medium text-gray-900">{ad.city?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">مالک</dt>
                <dd className="font-medium text-gray-900" dir="ltr">
                  {ad.user?.username ?? ad.user?.mobile ?? '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">اطلاعات تماس</dt>
                <dd className="font-medium text-gray-900" dir="ltr">
                  {ad.contactInfo ?? '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">تعداد بازدید</dt>
                <dd className="font-medium text-gray-900">{ad.viewsCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">تاریخ ثبت</dt>
                <dd className="font-medium text-gray-900">{formatDate(ad.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">تاریخ انقضا</dt>
                <dd className="font-medium text-gray-900">{formatDate(ad.expiresAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">امتیاز</dt>
                <dd className="font-medium text-gray-900">
                  {ad.ratingCount > 0
                    ? `${ad.ratingAvg.toFixed(1)} از ۵ (${ad.ratingCount.toLocaleString('fa-IR')} رأی)`
                    : 'بدون امتیاز'}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
