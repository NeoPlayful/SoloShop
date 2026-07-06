interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({
  icon = "📭",
  title = "暂无数据",
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="mb-4 text-5xl">{icon}</span>
      <h3 className="mb-2 text-lg font-medium text-gray-600">{title}</h3>
      {description && <p className="mb-4 text-sm text-gray-400">{description}</p>}
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
