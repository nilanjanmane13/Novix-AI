/** Three bouncing dots with an accessible label. */
export default function LoadingState({ label = "Thinking", showLabel = true }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-mist-400" role="status" aria-live="polite">
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-dot-bounce rounded-full bg-violet-300" />
        <span className="h-1.5 w-1.5 animate-dot-bounce rounded-full bg-violet-300 [animation-delay:0.15s]" />
        <span className="h-1.5 w-1.5 animate-dot-bounce rounded-full bg-violet-300 [animation-delay:0.3s]" />
      </span>
      {showLabel ? <span>{label}</span> : <span className="sr-only">{label}</span>}
    </div>
  );
}
