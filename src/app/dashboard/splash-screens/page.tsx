import { DeleteButton } from '@/components/delete-button';
import { EntityModal } from '@/components/entity-modal';
import { apiGet } from '@/lib/api';
import { proxiedImageUrl } from '@/lib/image';
import { requireAdminUser } from '@/lib/session';
import type { City, SplashScreen } from '@/lib/types';
import {
  createSplashScreenAction,
  deleteSplashScreenAction,
  updateSplashScreenAction,
} from './actions';

export default async function SplashScreensPage() {
  const { token } = await requireAdminUser();
  const [splashScreens, cities] = await Promise.all([
    apiGet<SplashScreen[]>('/splash-screens/all', token),
    apiGet<City[]>('/cities', token),
  ]);

  const cityOptions = cities.map(city => ({ value: city.id, label: city.name }));

  const fields = [
    { name: 'imageFile', label: 'تصویر اسپلش', type: 'image' as const, required: true },
    { name: 'imageUrl', label: '', type: 'hidden' as const },
    { name: 'cityId', label: 'شهر', type: 'select' as const, options: cityOptions, required: true },
  ];
  // Editing an existing splash screen doesn't require re-uploading an image —
  // the current one carries forward via the hidden `imageUrl` field. The city
  // is fixed once created (one splash per city, upserted by the backend), so
  // it's dropped from the edit form entirely — only the image can change.
  const editFields = fields
    .filter(field => field.name !== 'cityId')
    .map(field => (field.name === 'imageFile' ? { ...field, required: false } : field));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تصاویر اسپلش</h1>
          <p className="mt-1 text-sm text-gray-500">
            مدیریت تصویر اسپلش (صفحه آغازین) اپلیکیشن برای هر شهر
          </p>
          {/* The app renders this full-screen with resizeMode «cover», so a
              landscape or small image is cropped hard on a phone — worth
              saying here rather than leaving each admin to discover it by
              uploading one. The size limit is the /uploads endpoint's. */}
          <p className="mt-1 text-xs text-gray-400">
            تصویر عمودی تمام‌صفحه (پیشنهادی ۱۲۴۰×۲۶۸۰ پیکسل، حجم زیر ۵ مگابایت،
            فرمت JPG/PNG/WebP — برای عکس تمام‌صفحه معمولاً JPG با کیفیت ۸۰٪
            بهترین نتیجه را می‌دهد). تصویر روی کل صفحه کشیده می‌شود و لبه‌های
            اضافه بریده می‌شود. شهرهایی که تصویر ندارند اسپلش پیش‌فرض اپ را
            می‌بینند و تصویر جدید از اجرای بعدیِ اپ نمایش داده می‌شود.
          </p>
        </div>
        <EntityModal
          triggerLabel="+ اسپلش جدید"
          triggerClassName="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          title="افزودن اسپلش"
          fields={fields}
          action={createSplashScreenAction}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {splashScreens.map(splash => (
          <div
            key={splash.id}
            className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200"
          >
            <div className="relative h-36 w-full bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={proxiedImageUrl(splash.imageUrl)} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="space-y-2 p-4">
              <p className="text-xs font-medium text-gray-700">شهر: {splash.city?.name ?? '—'}</p>
              <p className="text-xs text-gray-400">
                آخرین بروزرسانی: {new Date(splash.updatedAt).toLocaleDateString('fa-IR')}
              </p>
              <div className="flex gap-2 pt-1">
                <EntityModal
                  triggerLabel="ویرایش"
                  title="ویرایش اسپلش"
                  fields={editFields}
                  initialValues={{
                    imageUrl: splash.imageUrl,
                    imageFilePreviewUrl: proxiedImageUrl(splash.imageUrl),
                  }}
                  action={updateSplashScreenAction.bind(null, splash.id)}
                />
                <DeleteButton
                  action={deleteSplashScreenAction.bind(null, splash.id)}
                  confirmText="آیا از حذف این اسپلش مطمئن هستید؟"
                />
              </div>
            </div>
          </div>
        ))}
        {splashScreens.length === 0 && (
          <p className="col-span-full py-10 text-center text-gray-400">اسپلشی ثبت نشده است</p>
        )}
      </div>
    </div>
  );
}
