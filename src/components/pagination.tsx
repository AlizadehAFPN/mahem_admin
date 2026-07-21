import Link from 'next/link';

export function Pagination({
  page,
  limit,
  total,
  basePath,
  searchParams,
}: {
  page: number;
  limit: number;
  total: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) {
    return null;
  }

  const hrefFor = (targetPage: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set('page', String(targetPage));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
      <span>
        صفحه {page} از {totalPages} ({total} مورد)
      </span>
      <div className="flex gap-2">
        <Link
          href={hrefFor(Math.max(1, page - 1))}
          className={`rounded-lg border border-gray-300 px-3 py-1.5 ${
            page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-gray-50'
          }`}
        >
          قبلی
        </Link>
        <Link
          href={hrefFor(Math.min(totalPages, page + 1))}
          className={`rounded-lg border border-gray-300 px-3 py-1.5 ${
            page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-gray-50'
          }`}
        >
          بعدی
        </Link>
      </div>
    </div>
  );
}
