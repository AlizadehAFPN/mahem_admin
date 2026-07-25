import Link from 'next/link';
import { AdLocationMap } from '@/components/ad-location-map';
import { ArchiveButton } from '@/components/archive-button';
import { Badge } from '@/components/badge';
import { DeleteButton } from '@/components/delete-button';
import { ImageArrayEditor } from '@/components/image-array-editor';
import { InlineEditField } from '@/components/inline-edit-field';
import { LocationPickerModal } from '@/components/location-picker-modal';
import { RejectButton } from '@/components/reject-button';
import { SetExpiryButton } from '@/components/set-expiry-button';
import { apiGet } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import type { Advertisement, Category, City } from '@/lib/types';
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

// Full breadcrumb path so a flat list of many categories stays navigable —
// mirrors the pathLabel helper in dashboard/categories/page.tsx.
function pathLabel(category: Category, byId: Map<string, Category>): string {
  const segments = [category.name];
  let current = category;
  while (current.parentId) {
    const parent = byId.get(current.parentId);
    if (!parent) break;
    segments.unshift(parent.name);
    current = parent;
  }
  return segments.join(' > ');
}

export default async function AdvertisementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, token } = await requireAdminUser();
  const [ad, categories, cities] = await Promise.all([
    apiGet<Advertisement>(`/admin/advertisements/${id}`, token),
    apiGet<Category[]>('/categories', token),
    apiGet<City[]>('/cities', token),
  ]);

  const canEdit = user.role === 'SUPER_ADMIN';
  const categoryById = new Map(categories.map(c => [c.id, c]));
  const categoryOptions = categories
    .filter(c => c.type === 'GENERAL')
    .map(c => ({ value: c.id, label: pathLabel(c, categoryById) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fa'));
  const cityOptions = cities
    .map(c => ({ value: c.id, label: c.name }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fa'));

  const attributeEntries = ad.attributes ? Object.entries(ad.attributes) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/advertisements" className="text-sm text-gray-500 hover:text-gray-700">
            ← بازگشت به لیست آگهی‌ها
          </Link>
          <div className="mt-1">
            <InlineEditField
              entityPath="advertisements"
              id={ad.id}
              fieldName="title"
              label="عنوان"
              value={ad.title}
              canEdit={canEdit}
              variant="heading"
            />
          </div>
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

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-3 text-sm font-semibold text-gray-500">تصاویر</h2>
        <ImageArrayEditor
          entityPath="advertisements"
          id={ad.id}
          fieldName="images"
          images={ad.images}
          canEdit={canEdit}
        />
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-500">موقعیت مکانی</h2>
          {canEdit && (
            <LocationPickerModal entityPath="advertisements" id={ad.id} lat={ad.lat} lng={ad.lng} />
          )}
        </div>
        {ad.lat != null && ad.lng != null ? (
          <AdLocationMap lat={ad.lat} lng={ad.lng} />
        ) : (
          <p className="text-sm text-gray-400">موقعیتی برای این آگهی ثبت نشده است</p>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <InlineEditField
              entityPath="advertisements"
              id={ad.id}
              fieldName="description"
              label="توضیحات"
              value={ad.description}
              canEdit={canEdit}
              variant="block"
            />
          </section>

          {attributeEntries.length > 0 && (
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <h2 className="mb-3 text-sm font-semibold text-gray-500">
                ویژگی‌های اختصاصی دسته‌بندی
              </h2>
              <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                {attributeEntries.map(([key, value]) => (
                  <InlineEditField
                    key={key}
                    entityPath="advertisements"
                    id={ad.id}
                    fieldName={key}
                    label={ATTRIBUTE_LABELS[key] ?? key}
                    value={typeof value === 'boolean' ? String(value) : (value as string | number)}
                    type={typeof value === 'boolean' ? 'select' : 'text'}
                    options={
                      typeof value === 'boolean'
                        ? [
                            { value: 'true', label: 'بله' },
                            { value: 'false', label: 'خیر' },
                          ]
                        : undefined
                    }
                    parseValue={typeof value === 'boolean' ? raw => raw === 'true' : undefined}
                    canEdit={canEdit}
                    displayValue={formatAttributeValue(key, value)}
                    dir={ATTRIBUTE_LABELS[key] ? undefined : 'ltr'}
                    buildPayload={parsed => ({ attributes: { ...ad.attributes, [key]: parsed } })}
                  />
                ))}
              </dl>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-3 text-sm font-semibold text-gray-500">اطلاعات</h2>
            <dl className="space-y-2 text-sm">
              <InlineEditField
                entityPath="advertisements"
                id={ad.id}
                fieldName="price"
                label="قیمت"
                value={ad.price ? Number(ad.price) : null}
                type="number"
                canEdit={canEdit}
                displayValue={formatPrice(ad.price)}
              />
              <InlineEditField
                entityPath="advertisements"
                id={ad.id}
                fieldName="categoryId"
                label="دسته‌بندی"
                value={ad.category?.id ?? null}
                type="select"
                options={categoryOptions}
                canEdit={canEdit}
                displayValue={ad.category?.name}
              />
              <InlineEditField
                entityPath="advertisements"
                id={ad.id}
                fieldName="cityId"
                label="شهر"
                value={ad.city?.id ?? null}
                type="select"
                options={cityOptions}
                canEdit={canEdit}
                displayValue={ad.city?.name}
              />
              <div className="flex justify-between border-b border-gray-100 py-1.5 text-sm">
                <dt className="text-gray-500">مالک</dt>
                <dd
                  className="font-medium text-gray-900"
                  dir={!ad.user?.username && ad.store?.name ? undefined : 'ltr'}
                >
                  {ad.user?.username ?? ad.store?.name ?? '—'}
                </dd>
              </div>
              <InlineEditField
                entityPath="advertisements"
                id={ad.id}
                fieldName="contactInfo"
                label="اطلاعات تماس"
                value={ad.contactInfo}
                canEdit={canEdit}
                dir="ltr"
              />
              <div className="flex justify-between border-b border-gray-100 py-1.5 text-sm">
                <dt className="text-gray-500">تعداد بازدید</dt>
                <dd className="font-medium text-gray-900">{ad.viewsCount}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 py-1.5 text-sm">
                <dt className="text-gray-500">تاریخ ثبت</dt>
                <dd className="font-medium text-gray-900">{formatDate(ad.createdAt)}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 py-1.5 text-sm">
                <dt className="text-gray-500">تاریخ انقضا</dt>
                <dd className="font-medium text-gray-900">{formatDate(ad.expiresAt)}</dd>
              </div>
              <div className="flex justify-between py-1.5 text-sm">
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
