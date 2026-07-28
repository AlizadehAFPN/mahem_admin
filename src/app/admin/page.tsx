import { redirect } from 'next/navigation';
import { getAccessToken } from '@/lib/session';

export default async function AdminPage() {
  const token = await getAccessToken();
  redirect(token ? '/dashboard' : '/login');
}
