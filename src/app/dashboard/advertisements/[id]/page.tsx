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

// Persian label for every attribute key the mobile app sends. The wording is
// taken from what the app itself shows users for the same field — the
// `fields`/`forms` namespaces in mahem's src/i18n/languages/fa.ts and the
// placeholders in components/forms/* — so a moderator reads the same words
// the poster filled in, not a second vocabulary invented here.
//
// Every key present in the database is covered; the `?? key` fallback below
// exists only so a brand-new key from a future app release still shows its
// value instead of vanishing from the panel.
//
// Two deliberate departures from the app's strings: `parking` is «پارکینگ»
// (fa.ts has the typo «پارکینک») and `features` uses the نیم‌فاصله spelling
// «ویژگی‌ها», matching this page's own section heading.
const ATTRIBUTE_LABELS: Record<string, string> = {
  // Shared / general
  ad_type: 'نوع آگهی',
  features: 'ویژگی‌ها',
  by_person: 'نوع آگهی‌دهنده',
  brand: 'برند',
  email: 'ایمیل',
  chatEnabled: 'چت فعال است',
  hideEmail: 'ایمیل در آگهی مخفی شود',
  // استخدامی
  education: 'میزان تحصیلات',
  degree: 'میزان تحصیلات',
  contractType: 'نوع قرارداد',
  contract_type: 'نوع قرارداد',
  // املاک
  area: 'مساحت',
  rooms: 'تعداد اتاق',
  floor: 'طبقه',
  elevator: 'آسانسور',
  parking: 'پارکینگ',
  suburbs: 'حاشیه شهر',
  rehn: 'رهن',
  ejare: 'اجاره',
  convertible: 'قابلیت تبدیل رهن به اجاره',
  documentType: 'سند اداری',
  // وسایل نقلیه
  product_year: 'سال تولید',
  operation_amount: 'کارکرد',
  base_type: 'نوع شاسی',
  is_cash: 'قسطی',
  // تخفیف‌یاب
  discountPercent: 'درصد تخفیف',
  originalPrice: 'قیمت اصلی',
  installment: 'امکان خرید اقساطی',
  testPeriodText: 'مهلت تست',
  usagePeriodText: 'بازه تاریخ استفاده',
  expiresAt: 'تاریخ پایان تخفیف',
};

// Attribute keys whose numeric value is an amount in Toman, and those that
// carry a unit. Without this they render as bare digit strings
// («485000000»), while the ad's own description spells the same number out
// as «۴۸۵٬۰۰۰٬۰۰۰ تومان».
const TOMAN_ATTRIBUTES = new Set(['rehn', 'ejare', 'originalPrice']);
const UNIT_ATTRIBUTES: Record<string, string> = {
  area: 'متر',
  operation_amount: 'کیلومتر',
  discountPercent: '٪',
};
// Stored as an ISO timestamp inside `attributes` (the تخفیف‌یاب end date) —
// must be shown as a Jalali date like every other date in this product,
// never as the raw Gregorian string the JSON holds.
const DATE_ATTRIBUTES = new Set(['expiresAt']);
// Year-like values: a plain number that must NOT get thousands separators
// (۱۴۰۳, not ۱٬۴۰۳).
const YEAR_ATTRIBUTES = new Set(['product_year']);

function formatAttributeValue(key: string, value: unknown) {
  // A JSON null/absent value used to render as the literal text "null".
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'بله' : 'خیر';
  }
  // `features` is a string on some ads and an array of strings on others
  // (the app changed shape); both must read as one line.
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join('، ') : '—';
  }
  if (key === 'email' && typeof value === 'string' && value) {
    return (
      <a href={`mailto:${value}`} className="text-blue-600 hover:underline" dir="ltr">
        {value}
      </a>
    );
  }
  if (DATE_ATTRIBUTES.has(key)) {
    return formatDate(String(value));
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isNaN(numeric) && String(value).trim() !== '') {
    if (YEAR_ATTRIBUTES.has(key)) {
      return String(numeric).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
    }
    if (TOMAN_ATTRIBUTES.has(key)) {
      return `${numeric.toLocaleString('fa-IR')} تومان`;
    }
    if (UNIT_ATTRIBUTES[key]) {
      return `${numeric.toLocaleString('fa-IR')} ${UNIT_ATTRIBUTES[key]}`;
    }
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
                    // The draft the editor starts from is always a plain
                    // string — an array (`features` on some ads) or a null
                    // would otherwise reach the input as an object and come
                    // back as "[object Object]"/"null" on save.
                    value={
                      value === null || value === undefined
                        ? ''
                        : Array.isArray(value)
                          ? value.join('، ')
                          : String(value)
                    }
                    type={typeof value === 'boolean' ? 'select' : 'text'}
                    options={
                      typeof value === 'boolean'
                        ? [
                            { value: 'true', label: 'بله' },
                            { value: 'false', label: 'خیر' },
                          ]
                        : undefined
                    }
                    parseAsBoolean={typeof value === 'boolean'}
                    canEdit={canEdit}
                    displayValue={formatAttributeValue(key, value)}
                    dir={ATTRIBUTE_LABELS[key] ? undefined : 'ltr'}
                    attributesBase={ad.attributes}
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
              <div className="flex justify-between gap-3 border-b border-gray-100 py-1.5 text-sm">
                <dt className="shrink-0 text-gray-500">تاریخ انقضا</dt>
                <dd className="text-left font-medium text-gray-900">
                  {ad.expiresAt ? (
                    formatDate(ad.expiresAt)
                  ) : ad.expiresAtEstimated ? (
                    <>
                      <span>{formatDate(ad.expiresAtEstimated)}</span>
                      {/* Deliberately marked. The stored expiresAt is null for
                          nearly every ad, so this date is computed from
                          تاریخ ثبت + the current expiry window. Most such
                          dates are already in the past, and an unlabelled
                          past date sitting next to a green «فعال» badge would
                          read as a broken archive job rather than as an
                          estimate. */}
                      <span className="mt-0.5 block text-xs font-normal text-gray-400">
                        تخمینی (تاریخ ثبت + مدت اعتبار) — انقضای قطعی ثبت نشده،
                        این آگهی خودکار آرشیو نمی‌شود.
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </dd>
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
