import { DeleteButton } from '@/components/delete-button';
import { EntityModal } from '@/components/entity-modal';
import { apiGet } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import type { City } from '@/lib/types';
import { createCityAction, deleteCityAction, updateCityAction } from './actions';

export default async function CitiesPage() {
  const { token } = await requireAdminUser();
  const cities = await apiGet<City[]>('/cities', token);

  const fields = [
    { name: 'name', label: 'نام شهر', required: true },
    { name: 'slug', label: 'شناسه (slug)', required: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">شهرها</h1>
          <p className="mt-1 text-sm text-gray-500">مدیریت لیست شهرهای قابل انتخاب در اپلیکیشن</p>
        </div>
        <EntityModal
          triggerLabel="+ شهر جدید"
          triggerClassName="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          title="افزودن شهر"
          fields={fields}
          action={createCityAction}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500">
            <tr>
              <th className="px-4 py-3">نام</th>
              <th className="px-4 py-3">شناسه</th>
              <th className="px-4 py-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {cities.map(city => (
              <tr key={city.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 font-medium text-gray-900">{city.name}</td>
                <td className="px-4 py-3 text-gray-500" dir="ltr">
                  {city.slug}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <EntityModal
                      triggerLabel="ویرایش"
                      title="ویرایش شهر"
                      fields={fields}
                      initialValues={{ name: city.name, slug: city.slug }}
                      action={updateCityAction.bind(null, city.id)}
                    />
                    <DeleteButton
                      action={deleteCityAction.bind(null, city.id)}
                      confirmText={`آیا از حذف شهر «${city.name}» مطمئن هستید؟`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {cities.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-gray-400">
                  شهری ثبت نشده است
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
