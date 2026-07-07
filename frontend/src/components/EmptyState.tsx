import { InboxArrowDownIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  const { t } = useTranslation();
  const label = title || t("noData");
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon || <InboxArrowDownIcon className="mb-4 h-12 w-12 text-text-tertiary" />}
      <h3 className="mb-2 text-lg font-medium text-text-secondary">{label}</h3>
      {description && <p className="mb-4 text-sm text-text-tertiary">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
