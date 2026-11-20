import { useEffect, useId, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  isConfirming = false,
  confirmTone = 'danger',
}) {
  const titleId = useId();
  const descriptionId = useId();
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    confirmRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isConfirming) onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, isConfirming, onClose]);

  if (!open) return null;

  const confirmClasses =
    confirmTone === 'danger'
      ? 'border-danger-border bg-danger text-white hover:bg-[#991b1b]'
      : 'border-border-active bg-brand text-text-on-brand hover:bg-brand-hover';

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-8"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isConfirming) onClose();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md rounded-panel border border-white/10 bg-surface p-5 text-text-heading shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-danger-soft text-danger">
            <AlertTriangle size={19} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="m-0 text-[1.05rem] font-semibold">
              {title}
            </h2>
            <p
              id={descriptionId}
              className="m-0 mt-2 text-[0.82rem] leading-5 text-text-secondary"
            >
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-text-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close confirmation"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className="h-10 rounded-full border border-border-subtle px-4 text-[0.78rem] font-semibold text-text-secondary hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className={`h-10 min-w-24 rounded-full border px-4 text-[0.78rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${confirmClasses}`}
          >
            {isConfirming ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
