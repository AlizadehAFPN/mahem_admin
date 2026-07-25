import Link from 'next/link';
import { Badge } from '@/components/badge';
import { ImageArrayEditor } from '@/components/image-array-editor';
import { InlineEditField } from '@/components/inline-edit-field';
import { RejectButton } from '@/components/reject-button';
import { SingleImageEditor } from '@/components/single-image-editor';
import { apiGet } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import type { Category, City, Store } from '@/lib/types';
import { approveStoreAction, confirmStorePaymentAction, rejectStoreAction } from '../actions';

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fa-IR');
}

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, token } = await requireAdminUser();
  const [store, categories, cities] = await Promise.all([
    apiGet<Store>(`/admin/stores/${id}`, token),
    apiGet<Category[]>('/categories', token),
    apiGet<City[]>('/cities', token),
  ]);

  const canEdit = user.role === 'SUPER_ADMIN';
  const categoryOptions = categories
    .filter(c => c.type === 'GENERAL')
    .map(c => ({ value: c.id, label: c.name }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fa'));
  const cityOptions = cities
    .map(c => ({ value: c.id, label: c.name }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fa'));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/stores" className="text-sm text-gray-500 hover:text-gray-700">
            ← بازگشت به لیست فروشگاه‌ها
          </Link>
          <div className="mt-1">
            <InlineEditField
              entityPath="stores"
              id={store.id}
              fieldName="name"
              label="نام فروشگاه"
              value={store.name}
              canEdit={canEdit}
              variant="heading"
            />
          </div>
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
                تایید پرداخت
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
        </div>
      </div>

      {store.rejectionReason && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
          دلیل رد: {store.rejectionReason}
        </div>
      )}

      <div className="flex gap-4">
        <SingleImageEditor
          entityPath="stores"
          id={store.id}
          fieldName="banner"
          label="کاور"
          url={store.banner}
          canEdit={canEdit}
          className="h-40 w-64"
        />
        <SingleImageEditor
          entityPath="stores"
          id={store.id}
          fieldName="logo"
          label="لوگو"
          url={store.logo}
          canEdit={canEdit}
        />
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-3 text-sm font-semibold text-gray-500">تصاویر فروشگاه</h2>
        <ImageArrayEditor
          entityPath="stores"
          id={store.id}
          fieldName="images"
          images={store.images}
          canEdit={canEdit}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 lg:col-span-2">
          <InlineEditField
            entityPath="stores"
            id={store.id}
            fieldName="description"
            label="توضیحات"
            value={store.description}
            canEdit={canEdit}
            variant="block"
          />
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-3 text-sm font-semibold text-gray-500">اطلاعات</h2>
          <dl className="space-y-2 text-sm">
            <InlineEditField
              entityPath="stores"
              id={store.id}
              fieldName="address"
              label="آدرس"
              value={store.address}
              canEdit={canEdit}
            />
            <InlineEditField
              entityPath="stores"
              id={store.id}
              fieldName="phone"
              label="تلفن"
              value={store.phone}
              canEdit={canEdit}
              dir="ltr"
            />
            <InlineEditField
              entityPath="stores"
              id={store.id}
              fieldName="categoryId"
              label="دسته‌بندی"
              value={store.category?.id ?? null}
              type="select"
              options={categoryOptions}
              canEdit={canEdit}
              displayValue={store.category?.name}
            />
            <InlineEditField
              entityPath="stores"
              id={store.id}
              fieldName="cityId"
              label="شهر"
              value={store.city?.id ?? null}
              type="select"
              options={cityOptions}
              canEdit={canEdit}
              displayValue={store.city?.name}
            />
            <div className="flex justify-between border-b border-gray-100 py-1.5 text-sm">
              <dt className="text-gray-500">مالک</dt>
              <dd className="font-medium text-gray-900" dir="ltr">
                {store.user?.username ?? store.user?.mobile ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between py-1.5 text-sm">
              <dt className="text-gray-500">اشتراک تا</dt>
              <dd className="font-medium text-gray-900">{formatDate(store.subscriptionExpiresAt)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
