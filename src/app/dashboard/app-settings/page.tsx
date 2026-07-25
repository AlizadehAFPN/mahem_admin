import { apiGet } from '@/lib/api';
import { requireAdminUser } from '@/lib/session';
import { AppSettingsForm } from './app-settings-form';

export interface AppSettings {
  aboutText: string;
  contactText: string;
  telegram: string;
  instagram: string;
  email: string;
  phone: string;
}

export default async function AppSettingsPage() {
  const { token } = await requireAdminUser();
  const settings = await apiGet<AppSettings>('/app-settings', token);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">محتوای اپلیکیشن</h1>
        <p className="mt-1 text-sm text-gray-500">
          متن صفحه‌های «درباره ما» و «تماس با ما» و اطلاعات تماس (تلگرام، اینستاگرام،
          ایمیل، تلفن) که در اپ نمایش داده می‌شوند. این اطلاعات برای همه شهرها یکسان است و
          هر فیلدی که خالی بماند، مقدار پیش‌فرض خودِ اپ نمایش داده می‌شود.
        </p>
      </div>

      <AppSettingsForm initial={settings} />
    </div>
  );
}
