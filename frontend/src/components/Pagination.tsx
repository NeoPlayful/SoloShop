interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-40 hover:bg-gray-50">上一页</button>
      <span className="text-sm text-gray-600">{page} / {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-40 hover:bg-gray-50">下一页</button>
    </div>
  );
}
