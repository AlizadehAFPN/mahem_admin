import Link from 'next/link';
import { Pagination } from '@/components/pagination';
import { apiGet } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import type { Conversation, Paginated } from '@/lib/types';

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { token } = await requireAdminUser();

  const page = Number(params.page ?? '1');
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', '20');

  const result = await apiGet<Paginated<Conversation>>(
    `/admin/conversations?${query.toString()}`,
    token,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">مکالمات</h1>
        <p className="mt-1 text-sm text-gray-500">
          مشاهده مکالمات چت بین کاربران درباره آگهی‌ها (فقط جهت پشتیبانی و رصد — بدون امکان ارسال پیام)
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500">
            <tr>
              <th className="px-4 py-3">آگهی</th>
              <th className="px-4 py-3">خریدار</th>
              <th className="px-4 py-3">فروشنده</th>
              <th className="px-4 py-3">آخرین پیام</th>
              <th className="px-4 py-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map(conversation => (
              <tr key={conversation.id} className="border-b border-gray-100 last:border-0">
                <td className="max-w-[220px] truncate px-4 py-3 font-medium text-gray-900">
                  {conversation.advertisement?.title ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-600" dir="ltr">
                  {conversation.buyer?.mobile}
                </td>
                <td className="px-4 py-3 text-gray-600" dir="ltr">
                  {conversation.seller?.mobile}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(conversation.lastMessageAt).toLocaleString('fa-IR')}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/conversations/${conversation.id}`}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
                  >
                    مشاهده پیام‌ها
                  </Link>
                </td>
              </tr>
            ))}
            {result.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  مکالمه‌ای ثبت نشده است
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={result.page}
        limit={result.limit}
        total={result.total}
        basePath="/dashboard/conversations"
        searchParams={{}}
      />
    </div>
  );
}
