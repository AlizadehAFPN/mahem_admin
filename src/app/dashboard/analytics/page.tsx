import { StatCard } from '@/components/stat-card';
import { JalaliRangePicker } from '@/components/jalali-range-picker';
import { apiGet } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import type {
  AnalyticsGranularity,
  AnalyticsOverview,
  AnalyticsType,
  City,
} from '@/lib/types';

const TYPE_OPTIONS: { value: '' | AnalyticsType; label: string }[] = [
  { value: '', label: 'همه' },
  // No separate تخفیف‌یاب row: a discount is an ordinary Advertisement (it
  // just carries a storeId when posted under a storefront), so its views are
  // already counted under «آگهی».
  { value: 'advertisement', label: 'آگهی' },
  { value: 'store', label: 'فروشگاه' },
  { value: 'job', label: 'مشاغل' },
];

const GRANULARITY_OPTIONS: { value: AnalyticsGranularity; label: string }[] = [
  { value: 'day', label: 'روزانه' },
  { value: 'week', label: 'هفتگی' },
  { value: 'month', label: 'ماهانه' },
];

// Horizontal bar sized relative to the largest value in its column — a
// dependency-free way to make the trend/city tables scannable at a glance.
function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full min-w-[60px] overflow-hidden rounded-full bg-gray-100">
      <div
        className="h-full rounded-full bg-gray-900"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { token } = await requireAdminUser();

  const type = (params.type ?? '') as '' | AnalyticsType;
  const cityId = params.cityId ?? '';
  const from = params.from ?? '';
  const to = params.to ?? '';
  const granularity = (params.granularity ?? 'day') as AnalyticsGranularity;

  const query = new URLSearchParams();
  if (type) query.set('type', type);
  if (cityId) query.set('cityId', cityId);
  if (from) query.set('from', from);
  if (to) query.set('to', to);
  query.set('granularity', granularity);

  const [cities, data] = await Promise.all([
    apiGet<City[]>('/cities', token),
    apiGet<AnalyticsOverview>(
      `/admin/analytics/overview?${query.toString()}`,
      token,
    ),
  ]);

  // Merge the three per-city breakdowns into one row per city so management
  // can read users + net views side by side ("هر شهر مجزا").
  const cityRows = new Map<
    string,
    { name: string; users: number; regs: number; views: number; unique: number }
  >();
  const rowFor = (id: string | null, name: string) => {
    const key = id ?? '__none__';
    let row = cityRows.get(key);
    if (!row) {
      row = { name, users: 0, regs: 0, views: 0, unique: 0 };
      cityRows.set(key, row);
    }
    return row;
  };
  for (const c of data.users.byCity) rowFor(c.cityId, c.cityName).users = c.count;
  for (const c of data.registrations.byCity)
    rowFor(c.cityId, c.cityName).regs = c.count;
  for (const c of data.views.byCity) {
    const row = rowFor(c.cityId, c.cityName);
    row.views = c.total;
    row.unique = c.unique;
  }
  const mergedCities = [...cityRows.values()].sort(
    (a, b) => b.views - a.views || b.users - a.users,
  );

  const maxViewSeries = Math.max(1, ...data.views.series.map((p) => p.total));
  const maxRegSeries = Math.max(1, ...data.registrations.series.map((p) => p.count));
  const maxCityViews = Math.max(1, ...mergedCities.map((c) => c.views));

  const rangeFa = `${
    from ? '' : 'پیش‌فرض '
  }${new Date(data.range.from).toLocaleDateString('fa-IR')} تا ${new Date(
    data.range.to,
  ).toLocaleDateString('fa-IR')}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">آمار و گزارش بازدید</h1>
        <p className="mt-1 text-sm text-gray-500">
          بازدید، کاربران و ثبت‌نام‌ها به تفکیک نوع، شهر و بازه زمانی
        </p>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap items-end gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            نوع آگهی
          </label>
          <select
            name="type"
            defaultValue={type}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            شهر
          </label>
          <select
            name="cityId"
            defaultValue={cityId}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">همه</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            بازه زمانی
          </label>
          <select
            name="granularity"
            defaultValue={granularity}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {GRANULARITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <JalaliRangePicker defaultFrom={from} defaultTo={to} />

        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          اعمال و نمایش گزارش
        </button>
      </form>

      <p className="text-xs text-gray-400">بازه گزارش: {rangeFa}</p>

      {/* Summary cards */}
      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="کل کاربران" value={data.users.total} />
          <StatCard label="ثبت‌نام در بازه" value={data.registrations.total} />
          <StatCard label="کل بازدید در بازه" value={data.views.total} />
          <StatCard label="بازدید یکتا در بازه" value={data.views.unique} />
        </div>
      </section>

      {/* Per-city breakdown */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500">
          به تفکیک شهر
        </h2>
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <table className="w-full text-right text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500">
              <tr>
                <th className="px-4 py-3">شهر</th>
                <th className="px-4 py-3">کاربران (کل)</th>
                <th className="px-4 py-3">ثبت‌نام (در بازه)</th>
                <th className="px-4 py-3">کل بازدید</th>
                <th className="px-4 py-3">بازدید یکتا</th>
                <th className="px-4 py-3 w-40">نسبت بازدید</th>
              </tr>
            </thead>
            <tbody>
              {mergedCities.map((c) => (
                <tr key={c.name} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.users}</td>
                  <td className="px-4 py-3 text-gray-600">{c.regs}</td>
                  <td className="px-4 py-3 text-gray-600">{c.views}</td>
                  <td className="px-4 py-3 text-gray-600">{c.unique}</td>
                  <td className="px-4 py-3">
                    <Bar value={c.views} max={maxCityViews} />
                  </td>
                </tr>
              ))}
              {mergedCities.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    داده‌ای برای این فیلترها یافت نشد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Views trend */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500">
          روند بازدید (
          {GRANULARITY_OPTIONS.find((g) => g.value === granularity)?.label})
        </h2>
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <table className="w-full text-right text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500">
              <tr>
                <th className="px-4 py-3">دوره</th>
                <th className="px-4 py-3">کل بازدید</th>
                <th className="px-4 py-3">بازدید یکتا</th>
                <th className="px-4 py-3 w-56">نمودار</th>
              </tr>
            </thead>
            <tbody>
              {data.views.series.map((p) => (
                <tr key={p.key} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900" dir="ltr">
                    {p.label}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.total}</td>
                  <td className="px-4 py-3 text-gray-600">{p.unique}</td>
                  <td className="px-4 py-3">
                    <Bar value={p.total} max={maxViewSeries} />
                  </td>
                </tr>
              ))}
              {data.views.series.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                    بازدیدی در این بازه ثبت نشده است
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Registrations trend */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500">
          روند ثبت‌نام کاربران (
          {GRANULARITY_OPTIONS.find((g) => g.value === granularity)?.label})
        </h2>
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <table className="w-full text-right text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500">
              <tr>
                <th className="px-4 py-3">دوره</th>
                <th className="px-4 py-3">ثبت‌نام</th>
                <th className="px-4 py-3 w-56">نمودار</th>
              </tr>
            </thead>
            <tbody>
              {data.registrations.series.map((p) => (
                <tr key={p.key} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900" dir="ltr">
                    {p.label}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.count}</td>
                  <td className="px-4 py-3">
                    <Bar value={p.count} max={maxRegSeries} />
                  </td>
                </tr>
              ))}
              {data.registrations.series.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-gray-400">
                    ثبت‌نامی در این بازه نبوده است
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
