import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import type { Conversation, Message, Paginated } from '@/lib/types';

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { token } = await requireAdminUser();
  const [conversation, messages] = await Promise.all([
    apiGet<Conversation>(`/admin/conversations/${id}`, token),
    apiGet<Paginated<Message>>(`/admin/conversations/${id}/messages?limit=100`, token),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/conversations" className="text-sm text-gray-500 hover:text-gray-700">
          ← بازگشت به لیست مکالمات
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          {conversation.advertisement?.title ?? 'مکالمه'}
        </h1>
        <p className="mt-1 text-sm text-gray-500" dir="ltr">
          {conversation.buyer?.mobile} ↔ {conversation.seller?.mobile}
        </p>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="space-y-3">
          {messages.items.map(message => {
            const isFromBuyer = message.senderId === conversation.buyerId;
            return (
              <div
                key={message.id}
                className={`flex ${isFromBuyer ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                    isFromBuyer ? 'bg-gray-100 text-gray-900' : 'bg-blue-100 text-blue-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <p className="mt-1 text-[10px] text-gray-400" dir="ltr">
                    {new Date(message.createdAt).toLocaleString('fa-IR')}
                  </p>
                </div>
              </div>
            );
          })}
          {messages.items.length === 0 && (
            <p className="py-10 text-center text-gray-400">پیامی ثبت نشده است</p>
          )}
        </div>
      </section>
    </div>
  );
}
