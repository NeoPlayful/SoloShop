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

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded border border-border px-3 py-1 text-sm text-text-primary disabled:opacity-40 hover:bg-surface-hover"
      >
        {t("prevPage")}
      </button>
      <span className="text-sm text-text-secondary">{t("pageInfo", { page, total: totalPages })}</span>
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded border border-border px-3 py-1 text-sm text-text-primary disabled:opacity-40 hover:bg-surface-hover"
      >
        {t("nextPage")}
      </button>
    </div>
  );
}
