import { useEffect, type ReactNode } from "react";

interface CenteredModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function CenteredModal({ open, onClose, title, children }: CenteredModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
