import { Check } from "lucide-react";

/** Glass progress rail for multi-step flows. */
export default function StepIndicator({ steps, current }) {
  return (
    <nav aria-label="Progress" className="glass flex items-center gap-1 rounded-full p-1.5 sm:gap-2 sm:p-2">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={s.label} className={`flex min-w-0 items-center gap-1 sm:flex-1 sm:gap-2 ${active ? "flex-[2.2]" : "flex-1"}`} aria-current={active ? "step" : undefined}>
            <div
              className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-2 py-2 transition-all duration-300 sm:px-4 ${
                active ? "bg-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]" : ""
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  done
                    ? "bg-success/90 text-ink-950"
                    : active
                    ? "bg-gradient-to-b from-violet-300 to-violet-600 text-white"
                    : "bg-white/[0.07] text-mist-500"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : n}
              </span>
              <span
                className={`truncate text-[13px] font-medium ${active ? "text-mist-100" : "hidden text-mist-500 sm:inline"}`}
              >
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
