import { useMemo, useState } from "react";
import { ChevronDown, CircleCheck, RotateCcw, CircleDashed } from "lucide-react";
import StepHeader from "./StepHeader";
import Segmented from "../ui/Segmented";
import { CURRICULUM } from "../../data/curriculum";
import { TOPIC_STATUSES } from "../../data/options";

export const MIN_RATED_TOPICS = 4;

const LEGEND = [
  { icon: CircleCheck, tone: "text-success", ...TOPIC_STATUSES[0] },
  { icon: RotateCcw, tone: "text-warn", ...TOPIC_STATUSES[1] },
  { icon: CircleDashed, tone: "text-mist-400", ...TOPIC_STATUSES[2] },
];

const daysOf = (mod) => CURRICULUM.days.filter((d) => d.day >= mod.days[0] && d.day <= mod.days[1]);

export default function CurriculumStep({ statusByDay, setStatusByDay }) {
  const [open, setOpen] = useState(() => new Set([CURRICULUM.modules[2]?.n ?? 1]));

  const counts = useMemo(() => {
    const c = { confident: 0, revising: 0, skipped: 0 };
    Object.values(statusByDay).forEach((s) => {
      if (c[s] !== undefined) c[s] += 1;
    });
    return c;
  }, [statusByDay]);

  const rated = counts.confident + counts.revising + counts.skipped;
  const covered = counts.confident + counts.revising;

  const toggle = (n) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  const setDay = (day, value) => setStatusByDay((prev) => ({ ...prev, [day]: value }));

  const setModule = (mod, value) =>
    setStatusByDay((prev) => {
      const next = { ...prev };
      daysOf(mod).forEach((d) => {
        if (value === null) delete next[d.day];
        else next[d.day] = value;
      });
      return next;
    });

  return (
    <section aria-labelledby="step-curriculum">
      <StepHeader
        title="Rate your curriculum coverage"
        subtitle={`The program has ${CURRICULUM.days.length} topics across ${CURRICULUM.modules.length} modules. Rate at least ${MIN_RATED_TOPICS}. The interview focuses on topics you know partly, then verifies the ones you are confident in.`}
      />

      <div className="glass rounded-3xl p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          {LEGEND.map((l) => (
            <div key={l.value} className="glass-flat rounded-2xl px-2 py-3">
              <l.icon className={`mx-auto h-4 w-4 ${l.tone}`} aria-hidden="true" />
              <p className="mt-1.5 font-display text-xl font-bold text-mist-100">{counts[l.value]}</p>
              <p className="text-[11px] leading-tight text-mist-400">{l.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-300 to-violet-500 transition-all duration-500"
              style={{ width: `${(rated / CURRICULUM.days.length) * 100}%` }}
            />
          </div>
          <p className={`text-xs tabular-nums ${rated >= MIN_RATED_TOPICS ? "text-success" : "text-mist-400"}`}>
            {rated} of {CURRICULUM.days.length} rated
            {rated < MIN_RATED_TOPICS && ` · ${MIN_RATED_TOPICS - rated} more needed`}
          </p>
        </div>
        {rated >= MIN_RATED_TOPICS && covered < 3 && (
          <p className="mt-3 rounded-xl bg-warn/10 px-3.5 py-2.5 text-xs leading-relaxed text-warn">
            Most topics are marked as not covered, so the interview will test fundamentals. Rate topics you have studied for a more relevant interview.
          </p>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {CURRICULUM.modules.map((mod) => {
          const days = daysOf(mod);
          const isOpen = open.has(mod.n);
          const ratedHere = days.filter((d) => statusByDay[d.day]).length;
          const panelId = `module-${mod.n}`;

          return (
            <div key={mod.n} className="glass overflow-hidden rounded-3xl">
              <button
                type="button"
                onClick={() => toggle(mod.n)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-6"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] font-medium text-violet-300">
                    Module {mod.n} · Days {mod.days[0]}–{mod.days[1]}
                  </span>
                  <span className="mt-0.5 block truncate font-display text-[15px] font-semibold text-mist-100 sm:text-base">{mod.title}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className={`pill ${ratedHere === days.length ? "!text-success" : ""}`}>
                    {ratedHere}/{days.length}
                  </span>
                  <ChevronDown className={`h-5 w-5 text-mist-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </span>
              </button>

              {isOpen && (
                <div id={panelId} className="border-t border-white/[0.08] px-3 pb-3 pt-2 sm:px-4">
                  <div className="flex flex-wrap items-center gap-2 px-2 py-2">
                    <span className="text-xs text-mist-500">Set whole module:</span>
                    {TOPIC_STATUSES.map((s) => (
                      <button key={s.value} type="button" onClick={() => setModule(mod, s.value)} className="pill transition-colors hover:bg-white/10">
                        {s.label}
                      </button>
                    ))}
                    {ratedHere > 0 && (
                      <button type="button" onClick={() => setModule(mod, null)} className="text-xs text-mist-500 underline underline-offset-4 hover:text-mist-200">
                        Clear
                      </button>
                    )}
                  </div>

                  <ul>
                    {days.map((d) => (
                      <li key={d.day} className="flex flex-col gap-3 rounded-2xl px-2 py-3.5 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:hover:bg-white/[0.03]">
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-snug text-mist-100">
                            <span className="mr-2 text-xs font-normal text-mist-500">Day {d.day}</span>
                            {d.title}
                          </p>
                          {d.tools?.length > 0 && <p className="mt-1 truncate text-xs text-mist-500">{d.tools.slice(0, 4).join(" · ")}</p>}
                        </div>
                        <div className="w-full shrink-0 lg:w-[21rem]">
                          <Segmented
                            ariaLabel={`Rating for ${d.title}`}
                            size="sm"
                            options={TOPIC_STATUSES.map(({ value, label, hint }) => ({ value, label, hint }))}
                            value={statusByDay[d.day] || null}
                            onChange={(v) => setDay(d.day, v)}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
