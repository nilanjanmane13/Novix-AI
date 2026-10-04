import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Glass confirmation dialog. Escape cancels, focus lands on the SAFE choice
 * for destructive actions, and Tab is kept inside the dialog.
 */
export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  danger = false,
}) {
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    (danger ? cancelRef : confirmRef).current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll("button:not([disabled])");
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, danger, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/65 px-4 pb-6 backdrop-blur-sm sm:items-center sm:pb-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onCancel?.()}
        >
          <motion.div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="glass-strong w-full max-w-sm rounded-3xl p-6"
          >
            <h2 id="confirm-title" className="font-display text-lg font-semibold text-mist-100">
              {title}
            </h2>
            {description && (
              <p id="confirm-desc" className="mt-2 text-sm leading-relaxed text-mist-400">
                {description}
              </p>
            )}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button ref={cancelRef} type="button" onClick={onCancel} className="btn-glass !py-2.5 text-[13px]">
                {cancelLabel}
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={onConfirm}
                className={`${danger ? "btn-danger" : "btn-primary"} !py-2.5 text-[13px]`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
