import { Check } from "lucide-react";

/** Glass checkbox with a real (visually hidden) input for accessibility. */
export default function Checkbox({ checked, onChange, children, id, invalid = false }) {
  return (
    <label
      htmlFor={id}
      className={`group flex cursor-pointer items-start gap-3 rounded-2xl p-3.5 transition-colors hover:bg-white/[0.04] ${
        invalid ? "ring-1 ring-danger/60" : ""
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-violet-300 ${
          checked
            ? "bg-gradient-to-b from-violet-300 to-violet-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_4px_12px_-2px_rgba(124,92,252,0.9)]"
            : "bg-white/[0.06] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]"
        }`}
      >
        {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
      </span>
      <span className="text-sm leading-relaxed text-mist-200">{children}</span>
    </label>
  );
}
