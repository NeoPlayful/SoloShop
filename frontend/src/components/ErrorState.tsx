import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title,
  message,
  onRetry,
}: ErrorStateProps) {
  const { t } = useTranslation();
  const label = title || t("failed");
  const msg = message || "数据加载异常，请稍后重试";
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <ExclamationTriangleIcon className="mb-4 h-12 w-12 text-red-500" />
      <h3 className="mb-2 text-lg font-medium text-red-500">{label}</h3>
      <p className="mb-4 text-sm text-text-tertiary">{msg}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
        >
          {t("retry")}
        </button>
      )}
    </div>
  );
}
