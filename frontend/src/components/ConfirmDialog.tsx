interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({ open, title = "确认操作", message, confirmText = "确认", cancelText = "取消", onConfirm, onCancel, danger }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-lg bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 text-lg font-semibold text-text-primary">{title}</h3>
        <p className="mb-6 text-text-secondary">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="rounded border border-border px-4 py-2 text-sm text-text-primary hover:bg-surface-hover">{cancelText}</button>
          <button onClick={onConfirm} className={`rounded px-4 py-2 text-sm text-white ${danger ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
