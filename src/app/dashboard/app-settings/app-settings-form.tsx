'use client';

import { useState, useTransition } from 'react';
import { updateAppSettingsAction } from './actions';
import type { AppSettings } from './page';

type Field = {
  key: keyof AppSettings;
  label: string;
  placeholder: string;
  multiline?: boolean;
  hint?: string;
  dir?: 'rtl' | 'ltr';
};

const FIELDS: Field[] = [
  {
    key: 'aboutText',
    label: 'متن «درباره ما»',
    placeholder: 'متنی که در صفحه درباره ما نمایش داده می‌شود…',
    multiline: true,
  },
  {
    key: 'contactText',
    label: 'متن «تماس با ما»',
    placeholder: 'متن معرفی بالای صفحه تماس با ما…',
    multiline: true,
  },
  {
    key: 'telegram',
    label: 'آیدی تلگرام',
    placeholder: 'مثلاً Mahem_App',
    hint: 'فقط آیدی (بدون @ و بدون آدرس کامل).',
    dir: 'ltr',
  },
  {
    key: 'instagram',
    label: 'آیدی اینستاگرام',
    placeholder: 'مثلاً Mahem.App',
    dir: 'ltr',
  },
  { key: 'email', label: 'ایمیل', placeholder: 'mahem@example.com', dir: 'ltr' },
  { key: 'phone', label: 'شماره تماس', placeholder: 'مثلاً 017-12345678', dir: 'ltr' },
];

export function AppSettingsForm({ initial }: { initial: AppSettings }) {
  const [values, setValues] = useState<AppSettings>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const setField = (key: keyof AppSettings, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const onSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateAppSettingsAction(values);
      if (result.success) {
        setSaved(true);
      } else {
        setError(result.error ?? 'خطایی رخ داد.');
      }
    });
  };

  return (
    <div className="max-w-2xl space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      {FIELDS.map(field => (
        <div key={field.key}>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            {field.label}
          </label>
          {field.multiline ? (
            <textarea
              rows={5}
              value={values[field.key] ?? ''}
              onChange={e => setField(field.key, e.target.value)}
              className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm leading-7"
              placeholder={field.placeholder}
            />
          ) : (
            <input
              type="text"
              dir={field.dir}
              value={values[field.key] ?? ''}
              onChange={e => setField(field.key, e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder={field.placeholder}
            />
          )}
          {field.hint && <p className="mt-1 text-xs text-gray-400">{field.hint}</p>}
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && (
        <p className="text-sm text-green-600">تنظیمات با موفقیت ذخیره شد.</p>
      )}

      <button
        type="button"
        disabled={isPending}
        onClick={onSave}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-40"
      >
        {isPending ? 'در حال ذخیره…' : 'ذخیره'}
      </button>
    </div>
  );
}
