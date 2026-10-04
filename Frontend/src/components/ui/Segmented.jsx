/**
 * Single-choice segmented control (radio group semantics).
 * options: { value, label, hint? }[]
 */
export default function Segmented({ options, value, onChange, ariaLabel, size = "md", fill = true }) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`glass-flat inline-flex max-w-full rounded-full p-1 ${fill ? "w-full" : ""}`}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.hint}
            onClick={() => onChange(o.value)}
            className={`min-w-0 flex-1 truncate rounded-full font-medium transition-all duration-200 ${
              size === "sm" ? "px-2 py-1.5 text-[11px] sm:px-3 sm:text-xs" : "px-3 py-2 text-xs sm:text-[13px]"
            } ${
              active
                ? "text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_16px_-6px_rgba(124,92,252,0.9)]"
                : "text-mist-400 hover:text-mist-100"
            }`}
            style={
              active
                ? { background: "linear-gradient(180deg, rgba(160,130,255,0.95), rgba(104,62,236,0.95))" }
                : undefined
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
