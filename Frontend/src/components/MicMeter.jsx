const BARS = 14;

/** Row of bars that rise with the microphone level. */
export default function MicMeter({ level = 0, className = "" }) {
  const active = Math.round(Math.min(1, level) * BARS);
  return (
    <div className={`flex h-5 items-end gap-[3px] ${className}`} role="img" aria-label="Microphone level">
      {Array.from({ length: BARS }, (_, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full transition-all duration-100 ${
            i < active ? "bg-gradient-to-t from-violet-400 to-violet-200" : "bg-white/[0.12]"
          }`}
          style={{ height: `${28 + (i / BARS) * 72}%` }}
        />
      ))}
    </div>
  );
}
