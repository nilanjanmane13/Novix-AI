import { useState } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function ErrorMessage({ message, technicalDetail, onRetry, retryLabel = "Try again" }) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div role="alert" className="glass animate-fade-up rounded-2xl p-4 sm:p-5" style={{ boxShadow: "inset 0 0 0 1px rgba(245,112,124,0.35)" }}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-relaxed text-mist-100">{message}</p>

          {onRetry && (
            <button type="button" onClick={onRetry} className="btn-glass mt-3 !px-4 !py-2 text-xs">
              <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
              {retryLabel}
            </button>
          )}

          {technicalDetail && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowDetail((v) => !v)}
                className="text-[11px] text-mist-500 underline decoration-dotted underline-offset-2 hover:text-mist-300"
              >
                {showDetail ? "Hide technical detail" : "Show technical detail"}
              </button>
              {showDetail && (
                <pre className="scroll-thin mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-mist-400">
                  {technicalDetail}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
