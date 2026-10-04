import { AlertCircle } from "lucide-react";

/** Label + control + optional hint/error, used across the setup steps. */
export default function Field({ label, htmlFor, required, hint, error, children, className = "" }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-2 flex items-baseline gap-1.5 text-[13px] font-medium text-mist-300">
        {label}
        {required && (
          <span className="text-violet-300" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-mist-500">{hint}</p>}
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-danger" role="alert">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
