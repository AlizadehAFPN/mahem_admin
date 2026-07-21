import Link from 'next/link';
import { DeleteButton } from '@/components/delete-button';
import { EntityModal } from '@/components/entity-modal';
import { apiGet } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import type { AttributeOption } from '@/lib/types';
import {
  createAttributeOptionAction,
  deleteAttributeOptionAction,
  updateAttributeOptionAction,
} from './actions';

// Known form fields these lists back (see mahem's
// src/components/picker/option-types.ts, now superseded by this table) —
// a fixed, curated list rather than free-typed groupKeys so admins can't
// typo a key the app never reads from.
const KNOWN_GROUPS: { key: string; label: string }[] = [
  { key: 'brand', label: 'برند / مدل خودرو' },
  { key: 'chassi', label: 'نوع شاسی خودرو' },
  { key: 'payType', label: 'نحوه پرداخت خودرو (نقد/اقساط)' },
  { key: 'carAdsCreator', label: 'نوع آگهی‌دهنده خودرو' },
  { key: 'floor', label: 'طبقه (ملک)' },
  { key: 'parking', label: 'پارکینگ (ملک)' },
  { key: 'elevator', label: 'آسانسور (ملک)' },
  { key: 'suburb', label: 'حومه شهر (ملک)' },
  { key: 'adsCreator', label: 'نوع آگهی‌دهنده ملک' },
  { key: 'adsType', label: 'نوع آگهی (فروشی/اجاره‌ای/درخواستی)' },
  { key: 'price', label: 'نوع قیمت' },
  { key: 'contractType', label: 'نوع همکاری (استخدامی)' },
  { key: 'education', label: 'مقطع تحصیلی (استخدامی)' },
  { key: 'image', label: 'گزینه بله / خیر' },
];

export default async function AttributeOptionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { token } = await requireAdminUser();
  const groupKey = params.group || KNOWN_GROUPS[0].key;

  const options = await apiGet<AttributeOption[]>(
    `/attribute-options/all?groupKey=${encodeURIComponent(groupKey)}`,
    token,
  );

  const fields = (initial?: AttributeOption) => [
    { name: 'groupKey', label: '', type: 'hidden' as const },
    { name: 'label', label: 'برچسب نمایشی', required: true },
    { name: 'order', label: 'ترتیب نمایش', type: 'number' as const },
    ...(initial ? [{ name: 'isActive', label: 'فعال', type: 'checkbox' as const }] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">فیلدهای اختصاصی آگهی</h1>
        <p className="mt-1 text-sm text-gray-500">
          مدیریت گزینه‌های هر فیلد (مثلاً افزودن برند/مدل جدید خودرو) بدون نیاز به آپدیت اپلیکیشن
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        {KNOWN_GROUPS.map(group => (
          <Link
            key={group.key}
            href={`/dashboard/attribute-options?group=${group.key}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              group.key === groupKey
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {group.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {KNOWN_GROUPS.find(g => g.key === groupKey)?.label ?? groupKey}
        </h2>
        <EntityModal
          triggerLabel="+ گزینه جدید"
          triggerClassName="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          title="افزودن گزینه"
          fields={fields()}
          initialValues={{ groupKey, order: options.length }}
          action={createAttributeOptionAction}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500">
            <tr>
              <th className="px-4 py-3">برچسب</th>
              <th className="px-4 py-3">ترتیب</th>
              <th className="px-4 py-3">وضعیت</th>
              <th className="px-4 py-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {options.map(option => (
              <tr key={option.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 font-medium text-gray-900">{option.label}</td>
                <td className="px-4 py-3 text-gray-500">{option.order}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      option.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {option.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <EntityModal
                      triggerLabel="ویرایش"
                      title="ویرایش گزینه"
                      fields={fields(option)}
                      initialValues={{
                        groupKey,
                        label: option.label,
                        order: option.order,
                        isActive: option.isActive,
                      }}
                      action={updateAttributeOptionAction.bind(null, option.id)}
                    />
                    <DeleteButton
                      action={deleteAttributeOptionAction.bind(null, option.id)}
                      confirmText={`آیا از حذف «${option.label}» مطمئن هستید؟`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {options.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                  گزینه‌ای ثبت نشده است
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
