import { DeleteButton } from '@/components/delete-button';
import { EntityModal } from '@/components/entity-modal';
import { apiGet } from '@/lib/api';
import { proxiedImageUrl } from '@/lib/image';
import { requireAdminUser } from '@/lib/session';
import type { Banner, City } from '@/lib/types';
import { createBannerAction, deleteBannerAction, updateBannerAction } from './actions';

export default async function BannersPage() {
  const { token } = await requireAdminUser();
  const [banners, cities] = await Promise.all([
    apiGet<Banner[]>('/banners/all', token),
    apiGet<City[]>('/cities', token),
  ]);

  const cityOptions = cities.map(city => ({ value: city.id, label: city.name }));

  const fields = [
    { name: 'imageFile', label: 'تصویر بنر', type: 'image' as const, required: true },
    { name: 'imageUrl', label: '', type: 'hidden' as const },
    { name: 'cityId', label: 'شهر', type: 'select' as const, options: cityOptions, required: true },
    { name: 'link', label: 'لینک مقصد (اختیاری)' },
    { name: 'order', label: 'ترتیب نمایش', type: 'number' as const },
    { name: 'isActive', label: 'فعال', type: 'checkbox' as const },
  ];
  // Editing an existing banner doesn't require re-uploading an image — the
  // current one carries forward via the hidden `imageUrl` field.
  const editFields = fields.map(field =>
    field.name === 'imageFile' ? { ...field, required: false } : field,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">بنرها</h1>
          <p className="mt-1 text-sm text-gray-500">مدیریت بنرهای تبلیغاتی صفحه اصلی اپلیکیشن</p>
        </div>
        <EntityModal
          triggerLabel="+ بنر جدید"
          triggerClassName="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          title="افزودن بنر"
          fields={fields}
          initialValues={{ order: 0, isActive: true }}
          action={createBannerAction}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map(banner => (
          <div key={banner.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
            <div className="relative h-36 w-full bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={proxiedImageUrl(banner.imageUrl)} alt="" className="h-full w-full object-cover" />
              <span
                className={`absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  banner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {banner.isActive ? 'فعال' : 'غیرفعال'}
              </span>
            </div>
            <div className="space-y-2 p-4">
              <p className="text-xs font-medium text-gray-700">شهر: {banner.city?.name ?? '—'}</p>
              <p className="truncate text-xs text-gray-500" dir="ltr">
                {banner.link || '—'}
              </p>
              <p className="text-xs text-gray-400">ترتیب: {banner.order}</p>
              <div className="flex gap-2 pt-1">
                <EntityModal
                  triggerLabel="ویرایش"
                  title="ویرایش بنر"
                  fields={editFields}
                  initialValues={{
                    imageUrl: banner.imageUrl,
                    imageFilePreviewUrl: proxiedImageUrl(banner.imageUrl),
                    cityId: banner.cityId,
                    link: banner.link,
                    order: banner.order,
                    isActive: banner.isActive,
                  }}
                  action={updateBannerAction.bind(null, banner.id)}
                />
                <DeleteButton
                  action={deleteBannerAction.bind(null, banner.id)}
                  confirmText="آیا از حذف این بنر مطمئن هستید؟"
                />
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <p className="col-span-full py-10 text-center text-gray-400">بنری ثبت نشده است</p>
        )}
      </div>
    </div>
  );
}
