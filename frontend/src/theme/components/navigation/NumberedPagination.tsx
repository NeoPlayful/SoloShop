import { useTranslation } from "react-i18next";

interface NumberedPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export function NumberedPagination({ page, pageSize, total, onChange }: NumberedPaginationProps) {
  const { t } = useTranslation();
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [1];
    if (page > 3) pages.push("...");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between py-4">
      <div className="text-sm text-text-secondary">
        {t("totalRecords", { total })}
      </div>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="rounded border border-border px-3 py-1 text-sm text-text-primary disabled:opacity-40 hover:bg-surface-hover transition-colors"
        >
          {t("prevPage")}
        </button>
        {pageNumbers.map((num, idx) =>
          num === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-sm text-text-tertiary">
              ...
            </span>
          ) : (
            <button
              key={num}
              onClick={() => onChange(num)}
              className={`min-w-[32px] rounded px-2 py-1 text-sm transition-colors ${
                num === page
                  ? "bg-blue-500 text-white"
                  : "border border-border text-text-primary hover:bg-surface-hover"
              }`}
            >
              {num}
            </button>
          )
        )}
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="rounded border border-border px-3 py-1 text-sm text-text-primary disabled:opacity-40 hover:bg-surface-hover transition-colors"
        >
          {t("nextPage")}
        </button>
      </div>
    </div>
  );
}
