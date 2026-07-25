import Link from 'next/link';
import { AdLocationMap } from '@/components/ad-location-map';
import { Badge } from '@/components/badge';
import { DeleteButton } from '@/components/delete-button';
import { InlineEditField } from '@/components/inline-edit-field';
import { LocationPickerModal } from '@/components/location-picker-modal';
import { RejectButton } from '@/components/reject-button';
import { SingleImageEditor } from '@/components/single-image-editor';
import { apiGet } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import type { Category, City, Job } from '@/lib/types';
import {
  approveJobAction,
  confirmJobPaymentAction,
  deleteJobAction,
  rejectJobAction,
} from '../actions';

function formatSalary(salary: string | null) {
  if (!salary) return '—';
  return `${Number(salary).toLocaleString('fa-IR')} تومان`;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fa-IR');
}

// Registration/contact fields on Job — each entry's second value is the
// UpdateJobDto field name the pencil icon PATCHes.
const CONTACT_FIELDS: { label: string; field: keyof Job }[] = [
  { label: 'مدیریت', field: 'manager' },
  { label: 'شماره ثبت', field: 'registerCode' },
  { label: 'تلفن ثابت', field: 'phone' },
  { label: 'تلفن همراه', field: 'mobile' },
  { label: 'فکس', field: 'fax' },
  { label: 'آدرس', field: 'address' },
  { label: 'تلگرام', field: 'telegram' },
  { label: 'اینستاگرام', field: 'instagram' },
  { label: 'ایمیل', field: 'email' },
];

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, token } = await requireAdminUser();
  const [job, categories, cities] = await Promise.all([
    apiGet<Job>(`/admin/jobs/${id}`, token),
    apiGet<Category[]>('/categories', token),
    apiGet<City[]>('/cities', token),
  ]);

  const canEdit = user.role === 'SUPER_ADMIN';
  const categoryOptions = categories
    .filter(c => c.type === 'JOB')
    .map(c => ({ value: c.id, label: c.name }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fa'));
  const cityOptions = cities
    .map(c => ({ value: c.id, label: c.name }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fa'));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/jobs" className="text-sm text-gray-500 hover:text-gray-700">
            ← بازگشت به لیست مشاغل
          </Link>
          <div className="mt-1">
            <InlineEditField
              entityPath="jobs"
              id={job.id}
              fieldName="title"
              label="عنوان"
              value={job.title}
              canEdit={canEdit}
              variant="heading"
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge value={job.approvalStatus} />
            <Badge value={job.status} />
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                job.paymentStatus === 'PAID'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {job.paymentStatus === 'PAID' ? 'پرداخت‌شده' : 'در انتظار پرداخت'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {job.paymentStatus !== 'PAID' && (
            <form action={confirmJobPaymentAction.bind(null, job.id)}>
              <button
                type="submit"
                className="rounded-lg border border-blue-300 px-4 py-2 text-sm text-blue-700 transition hover:bg-blue-50"
              >
                تایید دریافت وجه
              </button>
            </form>
          )}
          {job.approvalStatus !== 'APPROVED' && (
            <>
              <form action={approveJobAction.bind(null, job.id)}>
                <button
                  type="submit"
                  className="rounded-lg border border-green-300 px-4 py-2 text-sm text-green-700 transition hover:bg-green-50"
                >
                  تایید
                </button>
              </form>
              <RejectButton action={rejectJobAction.bind(null, job.id)} />
            </>
          )}
          <DeleteButton
            action={deleteJobAction.bind(null, job.id)}
            confirmText={`آیا از حذف قطعی آگهی «${job.title}» مطمئن هستید؟ این عمل قابل بازگشت نیست.`}
          />
        </div>
      </div>

      {job.rejectionReason && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
          دلیل رد: {job.rejectionReason}
        </div>
      )}

      <div className="flex gap-4">
        <SingleImageEditor
          entityPath="jobs"
          id={job.id}
          fieldName="banner"
          label="بنر"
          url={job.banner}
          canEdit={canEdit}
          className="h-40 w-64"
        />
        <SingleImageEditor
          entityPath="jobs"
          id={job.id}
          fieldName="logo"
          label="لوگو"
          url={job.logo}
          canEdit={canEdit}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 lg:col-span-2">
          <InlineEditField
            entityPath="jobs"
            id={job.id}
            fieldName="description"
            label="توضیحات"
            value={job.description}
            canEdit={canEdit}
            variant="block"
          />
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-3 text-sm font-semibold text-gray-500">اطلاعات صنف</h2>
          <dl className="space-y-2 text-sm">
            <InlineEditField
              entityPath="jobs"
              id={job.id}
              fieldName="categoryId"
              label="نوع صنف"
              value={job.category?.id ?? null}
              type="select"
              options={categoryOptions}
              canEdit={canEdit}
              displayValue={job.category?.name}
            />
            <InlineEditField
              entityPath="jobs"
              id={job.id}
              fieldName="cityId"
              label="شهر"
              value={job.city?.id ?? null}
              type="select"
              options={cityOptions}
              canEdit={canEdit}
              displayValue={job.city?.name}
            />
            <div className="flex justify-between border-b border-gray-100 py-1.5 text-sm">
              <dt className="text-gray-500">مالک</dt>
              <dd className="font-medium text-gray-900" dir="ltr">
                {job.user?.username ?? job.user?.mobile ?? '—'}
              </dd>
            </div>
            <InlineEditField
              entityPath="jobs"
              id={job.id}
              fieldName="salary"
              label="حقوق"
              value={job.salary ? Number(job.salary) : null}
              type="number"
              canEdit={canEdit}
              displayValue={formatSalary(job.salary)}
            />
            <div className="flex justify-between py-1.5 text-sm">
              <dt className="text-gray-500">تاریخ انقضا</dt>
              <dd className="font-medium text-gray-900">{formatDate(job.expiresAt)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-3 text-sm font-semibold text-gray-500">اطلاعات تماس و ثبت</h2>
        <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-3">
          {CONTACT_FIELDS.map(({ label, field }) => (
            <InlineEditField
              key={field}
              entityPath="jobs"
              id={job.id}
              fieldName={field}
              label={label}
              value={(job[field] as string | null) ?? null}
              canEdit={canEdit}
              dir="ltr"
            />
          ))}
        </dl>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-500">موقعیت مکانی</h2>
          {canEdit && <LocationPickerModal entityPath="jobs" id={job.id} lat={job.lat} lng={job.lng} />}
        </div>
        {job.lat != null && job.lng != null ? (
          <AdLocationMap lat={job.lat} lng={job.lng} />
        ) : (
          <p className="text-sm text-gray-400">موقعیتی برای این صنف ثبت نشده است</p>
        )}
      </section>
    </div>
  );
}
