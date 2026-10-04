import { Check } from "lucide-react";

/** Multi-select chips (e.g. tools). */
export default function ChipSelect({ options, values, onChange, max, ariaLabel }) {
  const toggle = (opt) => {
    if (values.includes(opt)) onChange(values.filter((v) => v !== opt));
    else if (!max || values.length < max) onChange([...values, opt]);
  };

  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = values.includes(opt);
        const blocked = !on && max && values.length >= max;
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={on}
            disabled={blocked}
            onClick={() => toggle(opt)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-35 ${
              on
                ? "bg-violet-500/30 text-violet-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_0_1px_rgba(183,161,255,0.6)]"
                : "bg-white/[0.045] text-mist-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(255,255,255,0.09)] hover:bg-white/[0.09]"
            }`}
          >
            {on && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}
