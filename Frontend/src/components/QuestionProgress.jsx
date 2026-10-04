/** Segmented progress rail: filled = answered, glowing = current. */
export default function QuestionProgress({ current, total, min }) {
  const segments = Math.max(total, min);
  return (
    <div className="flex items-center gap-3" role="status" aria-label={`Question ${current} of ${total}`}>
      <div className="hidden items-center gap-1 sm:flex" aria-hidden="true">
        {Array.from({ length: segments }, (_, i) => {
          const n = i + 1;
          const done = n < current;
          const now = n === current;
          return (
            <span
              key={n}
              className={`h-1.5 rounded-full transition-all duration-500 ${now ? "w-5 sm:w-6" : "w-1.5 sm:w-3"} ${
                done ? "bg-violet-400" : now ? "bg-gradient-to-r from-violet-200 to-violet-400 shadow-[0_0_10px_2px_rgba(154,123,255,0.7)]" : "bg-white/[0.12]"
              }`}
            />
          );
        })}
      </div>
      <span className="whitespace-nowrap text-xs font-medium tabular-nums text-mist-200">
        <span className="hidden sm:inline">Question </span>
        {current}
        <span className="text-mist-500"> / {total}</span>
      </span>
    </div>
  );
}
