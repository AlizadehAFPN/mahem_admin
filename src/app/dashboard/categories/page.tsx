import { DeleteButton } from '@/components/delete-button';
import { EntityModal } from '@/components/entity-modal';
import { apiGet } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import type { Category } from '@/lib/types';
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from './actions';

function typeLabel(type: Category['type']) {
  return type === 'JOB' ? 'شغلی' : 'عمومی';
}

// Full breadcrumb path (e.g. "[عمومی] املاک > فروش مسکونی") so a flat list
// of 60+ categories is still navigable when choosing a parent.
function pathLabel(category: Category, byId: Map<string, Category>): string {
  const segments = [category.name];
  let current = category;
  while (current.parentId) {
    const parent = byId.get(current.parentId);
    if (!parent) break;
    segments.unshift(parent.name);
    current = parent;
  }
  return `[${typeLabel(category.type)}] ${segments.join(' > ')}`;
}

function depth(category: Category, byId: Map<string, Category>): number {
  let d = 1;
  let current = category;
  while (current.parentId) {
    const parent = byId.get(current.parentId);
    if (!parent) break;
    d += 1;
    current = parent;
  }
  return d;
}

// Pre-order walk of the category tree, siblings sorted by `order` (ties by
// name) — this is the same ordering the backend now serves the app with
// (see CategoriesService.findAll), so the table reads top-to-bottom exactly
// like the app's category menus do, rather than a flat alphabetical list.
function sortByOrder(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'fa'));
}

// GENERAL and JOB are two separate root trees (both start their own `order`
// count at 0), so they're flattened as separate passes and concatenated —
// otherwise their roots would interleave by coincidentally-equal order
// values instead of staying grouped by type.
function flattenByDisplayOrder(categories: Category[]): Category[] {
  const childrenByParent = new Map<string | null, Category[]>();
  for (const category of categories) {
    const key = category.parentId;
    childrenByParent.set(key, [...(childrenByParent.get(key) ?? []), category]);
  }

  const result: Category[] = [];
  const visit = (parentId: string | null) => {
    for (const category of sortByOrder(childrenByParent.get(parentId) ?? [])) {
      result.push(category);
      visit(category.id);
    }
  };

  const roots = sortByOrder(childrenByParent.get(null) ?? []);
  for (const type of ['GENERAL', 'JOB'] as const) {
    for (const root of roots.filter(r => r.type === type)) {
      result.push(root);
      visit(root.id);
    }
  }
  return result;
}

export default async function CategoriesPage() {
  const { token } = await requireAdminUser();
  const categories = await apiGet<Category[]>('/categories', token);
  const categoryById = new Map(categories.map(c => [c.id, c]));

  // Only categories at depth 1 or 2 can accept a child without breaking the
  // 3-level limit the backend enforces — depth-3 categories are excluded so
  // an admin can't even attempt an invalid selection.
  const selectableParents = categories
    .filter(c => depth(c, categoryById) < 3)
    .map(c => ({ value: c.id, label: pathLabel(c, categoryById) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fa'));

  const parentOptions = (excludeId?: string) => [
    { value: '', label: 'بدون دسته والد (سطح ۱)' },
    ...selectableParents.filter(o => o.value !== excludeId),
  ];

  const fields = (initial?: Category) => [
    { name: 'name', label: 'نام دسته‌بندی', required: true },
    { name: 'slug', label: 'شناسه (slug)', required: true },
    { name: 'icon', label: 'آیکون (اختیاری)' },
    { name: 'color', label: 'رنگ پین نقشه (اختیاری، مثل ‎#E53935‎)' },
    {
      name: 'type',
      label: 'نوع',
      type: 'select' as const,
      options: [
        { value: 'GENERAL', label: 'عمومی (آگهی)' },
        { value: 'JOB', label: 'شغلی' },
      ],
    },
    {
      name: 'parentId',
      label: 'دسته والد (حداکثر تا سطح ۳)',
      type: 'select' as const,
      options: parentOptions(initial?.id),
    },
    {
      name: 'order',
      label: 'ترتیب نمایش (بین دسته‌های هم‌سطح)',
      type: 'number' as const,
    },
  ];

  const sortedCategories = flattenByDisplayOrder(categories);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">دسته‌بندی‌ها</h1>
          <p className="mt-1 text-sm text-gray-500">
            مدیریت دسته‌بندی‌های آگهی و شغل — حداکثر ۳ سطح (دسته / کتگوری / زیرکتگوری)
          </p>
        </div>
        <EntityModal
          triggerLabel="+ دسته‌بندی جدید"
          triggerClassName="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          title="افزودن دسته‌بندی"
          fields={fields()}
          action={createCategoryAction}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500">
            <tr>
              <th className="px-4 py-3">مسیر کامل</th>
              <th className="px-4 py-3">شناسه</th>
              <th className="px-4 py-3">رنگ</th>
              <th className="px-4 py-3">نوع</th>
              <th className="px-4 py-3">سطح</th>
              <th className="px-4 py-3">ترتیب</th>
              <th className="px-4 py-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {sortedCategories.map(category => (
              <tr key={category.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {pathLabel(category, categoryById).replace(/^\[[^\]]+\]\s*/, '')}
                </td>
                <td className="px-4 py-3 text-gray-500" dir="ltr">
                  {category.slug}
                </td>
                <td className="px-4 py-3">
                  {category.color ? (
                    <span className="inline-flex items-center gap-1.5" dir="ltr">
                      <span
                        className="inline-block h-4 w-4 rounded-full ring-1 ring-gray-300"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-xs text-gray-500">{category.color}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                    {typeLabel(category.type)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{depth(category, categoryById)}</td>
                <td className="px-4 py-3 text-gray-500">{category.order}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <EntityModal
                      triggerLabel="ویرایش"
                      title="ویرایش دسته‌بندی"
                      fields={fields(category)}
                      initialValues={{
                        name: category.name,
                        slug: category.slug,
                        icon: category.icon,
                        color: category.color,
                        type: category.type,
                        parentId: category.parentId,
                        order: category.order,
                      }}
                      action={updateCategoryAction.bind(null, category.id)}
                    />
                    <DeleteButton
                      action={deleteCategoryAction.bind(null, category.id)}
                      confirmText={`آیا از حذف دسته‌بندی «${category.name}» مطمئن هستید؟`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  دسته‌بندی‌ای ثبت نشده است
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
