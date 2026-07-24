import Link from 'next/link';
import { AdLocationMap } from '@/components/ad-location-map';
import { Badge } from '@/components/badge';
import { DeleteButton } from '@/components/delete-button';
import { RejectButton } from '@/components/reject-button';
import { apiGet } from '@/lib/api';
import { proxiedImageUrl } from '@/lib/image';
import { requireAdminUser } from '@/lib/session';
import type { Job } from '@/lib/types';
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

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { token } = await requireAdminUser();
  const job = await apiGet<Job>(`/admin/jobs/${id}`, token);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/jobs" className="text-sm text-gray-500 hover:text-gray-700">
            ← بازگشت به لیست مشاغل
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{job.title}</h1>
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
        {job.banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={proxiedImageUrl(job.banner)} alt="" className="h-40 w-64 rounded-xl object-cover ring-1 ring-gray-200" />
        )}
        {job.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={proxiedImageUrl(job.logo)} alt="" className="h-40 w-40 rounded-xl object-cover ring-1 ring-gray-200" />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-gray-500">توضیحات</h2>
          <p className="whitespace-pre-wrap text-sm text-gray-800">{job.description}</p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-3 text-sm font-semibold text-gray-500">اطلاعات صنف</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">نوع صنف</dt>
              <dd className="font-medium text-gray-900">{job.category?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">شهر</dt>
              <dd className="font-medium text-gray-900">{job.city?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">مالک</dt>
              <dd className="font-medium text-gray-900" dir="ltr">
                {job.user?.username ?? job.user?.mobile ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">حقوق</dt>
              <dd className="font-medium text-gray-900">{formatSalary(job.salary)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-3 text-sm font-semibold text-gray-500">اطلاعات تماس و ثبت</h2>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-3">
          {[
            ['مدیریت', job.manager],
            ['شماره ثبت', job.registerCode],
            ['تلفن ثابت', job.phone],
            ['تلفن همراه', job.mobile],
            ['فکس', job.fax],
            ['آدرس', job.address],
            ['تلگرام', job.telegram],
            ['اینستاگرام', job.instagram],
            ['ایمیل', job.email],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-gray-100 py-1.5 text-sm">
              <dt className="text-gray-500">{label}</dt>
              <dd className="font-medium text-gray-900" dir="ltr">
                {value || '—'}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-3 text-sm font-semibold text-gray-500">موقعیت مکانی</h2>
        {job.lat != null && job.lng != null ? (
          <AdLocationMap lat={job.lat} lng={job.lng} />
        ) : (
          <p className="text-sm text-gray-400">موقعیتی برای این صنف ثبت نشده است</p>
        )}
      </section>
    </div>
  );
}
