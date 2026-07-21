const styles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-600',
  ADMIN: 'bg-blue-100 text-blue-800',
  SUPER_ADMIN: 'bg-purple-100 text-purple-800',
  USER: 'bg-gray-100 text-gray-600',
  REVIEWED: 'bg-green-100 text-green-800',
  DISMISSED: 'bg-gray-100 text-gray-600',
};

const labels: Record<string, string> = {
  PENDING: 'در انتظار تایید',
  APPROVED: 'تایید شده',
  REJECTED: 'رد شده',
  ACTIVE: 'فعال',
  INACTIVE: 'غیرفعال',
  ADMIN: 'ادمین',
  SUPER_ADMIN: 'سوپر ادمین',
  USER: 'کاربر',
  REVIEWED: 'بررسی شده',
  DISMISSED: 'رد شده (بی‌مورد)',
};

export function Badge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[value] ?? 'bg-gray-100 text-gray-600'
      }`}
    >
      {labels[value] ?? value}
    </span>
  );
}
