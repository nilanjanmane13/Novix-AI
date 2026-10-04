import { useEffect, useState } from "react";
import { animate, motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Home,
  ListChecks,
  MessageSquareText,
  ShieldAlert,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import Logo from "../components/Logo";
import { formatDuration } from "../utils/format";

/* ------------------------------ helpers ------------------------------ */

const tone = (score10) => (score10 >= 7.5 ? "success" : score10 >= 5 ? "warn" : "danger");
const TONE_BAR = {
  success: "from-emerald-300 to-emerald-500",
  warn: "from-amber-200 to-amber-400",
  danger: "from-rose-300 to-rose-500",
};
const TONE_TEXT = { success: "text-success", warn: "text-warn", danger: "text-danger" };

const levelColor = (score100) => (score100 >= 72 ? ["#8cf0cb", "#2fbf8d"] : score100 >= 45 ? ["#ffe3a3", "#f0a93b"] : ["#ffb3bb", "#e5546a"]);

function useCountUp(target, duration = 1.4) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const controls = animate(0, target, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: (x) => setV(Math.round(x)) });
    return () => controls.stop();
  }, [target, duration]);
  return v;
}

function Card({ title, icon: Icon, children, className = "" }) {
  return (
    <section className={`glass print-keep rounded-3xl p-5 sm:p-7 ${className}`}>
      <div className="flex items-center gap-2.5">
        {Icon && <Icon className="h-4 w-4 text-violet-300" aria-hidden="true" />}
        <h2 className="font-display text-base font-semibold text-mist-100 sm:text-lg">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Bar({ value, max = 100, tone: t = "success" }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10" role="presentation">
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${TONE_BAR[t]}`}
        initial={{ width: 0 }}
        whileInView={{ width: `${Math.max(2, (value / max) * 100)}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

function ScoreRing({ score }) {
  const shown = useCountUp(score);
  const size = 208;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [from, to] = levelColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className="absolute inset-3 rounded-full blur-2xl" style={{ background: `radial-gradient(circle, ${to}55, transparent 70%)` }} aria-hidden="true" />
      <svg width={size} height={size} className="relative -rotate-90" role="img" aria-label={`Overall score ${score} out of 100`}>
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-6xl font-extrabold leading-none tracking-tight text-mist-100">{shown}</span>
        <span className="mt-1 text-xs text-mist-400">out of 100</span>
      </div>
    </div>
  );
}

function List({ items, icon: Icon, iconClass }) {
  return (
    <ul className="space-y-3">
      {items.map((t, i) => (
        <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-mist-200">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} aria-hidden="true" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function QuestionRow({ q }) {
  const [open, setOpen] = useState(false);
  const t = tone(q.score);
  const answerType = { dont_know: "Not answered", off_topic: "Off topic", partial: "Partial answer" }[q.answerType];

  return (
    <li className="glass-flat print-keep overflow-hidden rounded-2xl">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-xs font-semibold text-mist-300">Q{q.questionNumber}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-mist-100">{q.topic}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[11px] text-mist-500">
            {q.depth && <span className="capitalize">{q.depth}</span>}
            {q.seconds > 0 && <span>{formatDuration(q.seconds)} to answer</span>}
            {answerType && <span className="text-warn">{answerType}</span>}
          </span>
        </span>
        <span className={`font-display text-lg font-bold tabular-nums ${TONE_TEXT[t]}`}>
          {q.score.toFixed(1)}
          <span className="text-xs font-normal text-mist-500">/10</span>
        </span>
        <ChevronDown className={`no-print h-4 w-4 shrink-0 text-mist-500 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <div className={`${open ? "block" : "hidden"} border-t border-white/[0.07] px-4 pb-4 pt-3 print:block`}>
        {q.question && <p className="text-sm leading-relaxed text-mist-300">{q.question}</p>}
        {q.note && (
          <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-mist-200">
            <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
            {q.note}
          </p>
        )}
      </div>
    </li>
  );
}

/* ------------------------------- page ------------------------------- */

export default function Results({ feedback: f, closingMessage, candidateName, onRestart }) {
  const hasScore = typeof f?.overallScore === "number";
  const topics = Object.entries(f?.topicPerformance || {});
  const questions = f?.questionPerformance || [];
  const timing = f?.timing;
  const completion = f?.completion;
  const integrity = f?.integrity;
  const name = f?.candidate?.name || candidateName || "Candidate";
  const date = f?.generatedAt ? new Date(f.generatedAt) : new Date();
  const maxSeconds = Math.max(1, ...(timing?.perQuestion || []).map((q) => q.seconds));

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  if (!f) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <div className="glass-strong max-w-md rounded-3xl p-8 text-center">
          <h1 className="font-display text-xl font-bold">No report available</h1>
          <p className="mt-2 text-sm text-mist-400">The report could not be loaded. Start a new interview to generate one.</p>
          <button type="button" className="btn-primary mt-6" onClick={onRestart}>Back to home</button>
        </div>
      </div>
    );
  }

  const integrityTone = integrity?.status === "clear" ? "success" : integrity?.status === "review" ? "danger" : "warn";
  const IntegrityIcon = integrity?.status === "clear" ? ShieldCheck : ShieldAlert;

  return (
    <div className="page-pad min-h-dvh pb-20">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-8">
        <div className="glass rounded-full py-2 pl-3 pr-5">
          <Logo size="sm" />
        </div>
        <div className="no-print flex items-center gap-2">
          <button type="button" onClick={() => window.print()} className="btn-glass !px-4 !py-2.5 text-[13px]">
            <Download className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Save as PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
          <button type="button" onClick={onRestart} className="btn-primary !px-4 !py-2.5 text-[13px]">
            <Home className="h-4 w-4" aria-hidden="true" />
            Home
          </button>
        </div>
      </header>

      <main className="mx-auto mt-8 w-full max-w-5xl space-y-5 px-4 sm:px-8">
        {/* ---- hero ---- */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="glass-strong print-keep overflow-hidden rounded-[2rem]">
          <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-[auto_1fr] md:items-center md:gap-12" style={{ background: "radial-gradient(90% 120% at 0% 0%, rgba(124,92,252,0.3), transparent 60%)" }}>
            <div className="mx-auto md:mx-0">
              {hasScore ? (
                <ScoreRing score={f.overallScore} />
              ) : (
                <div className="glass-flat flex h-52 w-52 items-center justify-center rounded-full text-center text-sm text-mist-400">
                  No score<br />yet
                </div>
              )}
            </div>

            <div className="text-center md:text-left">
              <p className="text-xs font-medium text-violet-300">Technical interview report card</p>
              <h1 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight text-mist-100 sm:text-4xl">{name}</h1>
              <p className="mt-1 text-sm text-mist-400">
                {[f.candidate?.role, f.candidate?.education].filter(Boolean).join(" · ")}
              </p>

              {hasScore && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  <span className="pill !px-3.5 !py-1.5 !text-sm !font-semibold !text-mist-100">{f.overallLevel}</span>
                  <span className="pill">Confidence: {f.confidence?.label}</span>
                  <span className={`pill ${completion?.completedNormally ? "" : "!text-warn"}`}>
                    {completion?.completedNormally ? "Completed" : "Ended early"}
                  </span>
                </div>
              )}

              <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-mist-200 md:mx-0">{f.verdict}</p>
              <p className="mt-4 text-xs text-mist-500">
                {date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })} · {completion?.questionsAnswered} of {completion?.questionsTotal} questions answered
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 px-6 py-5 sm:px-10">
            <p className="text-sm leading-relaxed text-mist-300">{f.summary}</p>
            {!completion?.completedNormally && (
              <p className="mt-3 rounded-xl bg-warn/10 px-4 py-2.5 text-xs leading-relaxed text-warn">
                The interview ended after {completion?.questionsAnswered} of at least {completion?.minQuestions} questions, so this score reflects limited evidence.
              </p>
            )}
          </div>
        </motion.section>

        {/* ---- dimensions + metrics ---- */}
        <div className="grid gap-5 lg:grid-cols-5">
          {f.dimensions?.length > 0 && (
            <Card title="Skill dimensions" icon={Target} className="lg:col-span-3">
              <ul className="space-y-5">
                {f.dimensions.map((d) => (
                  <li key={d.key}>
                    <div className="mb-2 flex items-baseline justify-between text-sm">
                      <span className="text-mist-200">{d.label}</span>
                      <span className={`font-semibold tabular-nums ${TONE_TEXT[tone(d.score / 10)]}`}>{d.score}%</span>
                    </div>
                    <Bar value={d.score} tone={tone(d.score / 10)} />
                  </li>
                ))}
              </ul>
              {f.communication && <p className="mt-6 border-t border-white/[0.08] pt-4 text-sm italic leading-relaxed text-mist-400">{f.communication}</p>}
            </Card>
          )}

          <Card title="Session metrics" icon={Clock} className={f.dimensions?.length ? "lg:col-span-2" : "lg:col-span-5"}>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                ["Answered", `${completion?.questionsAnswered ?? 0}`],
                ["Total time", formatDuration(timing?.totalSeconds ?? 0)],
                ["Avg answer", `${timing?.averageAnswerSeconds ?? 0}s`],
              ].map(([k, v]) => (
                <div key={k} className="glass-flat rounded-2xl px-2 py-3.5">
                  <p className="font-display text-lg font-bold text-mist-100 sm:text-xl">{v}</p>
                  <p className="mt-1 text-[11px] text-mist-400">{k}</p>
                </div>
              ))}
            </div>
            {timing?.perQuestion?.length > 0 && (
              <div className="mt-5">
                <p className="mb-3 text-xs text-mist-500">Time per question</p>
                <div className="flex items-end gap-1.5" role="img" aria-label="Time per question">
                  {timing.perQuestion.map((q) => (
                    <div key={q.questionNumber} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                      <div className="flex h-20 w-full items-end">
                        <div className="w-full rounded-t-md bg-gradient-to-t from-violet-600/70 to-violet-300/90" style={{ height: `${Math.max(8, (q.seconds / maxSeconds) * 100)}%` }} title={`Q${q.questionNumber}: ${q.seconds}s`} />
                      </div>
                      <span className="text-[9px] text-mist-500">{q.questionNumber}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* ---- topics ---- */}
        {topics.length > 0 && (
          <Card title="Performance by topic" icon={TrendingUp}>
            <ul className="grid gap-x-10 gap-y-5 md:grid-cols-2">
              {topics.map(([topic, p]) => (
                <li key={topic}>
                  <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-mist-200">{topic}</span>
                    <span className={`shrink-0 font-semibold tabular-nums ${TONE_TEXT[tone(p.score)]}`}>{p.score.toFixed(1)}/10</span>
                  </div>
                  <Bar value={p.score} max={10} tone={tone(p.score)} />
                  <p className="mt-1.5 text-[11px] text-mist-500">{p.questions} question{p.questions === 1 ? "" : "s"}</p>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* ---- strengths / gaps ---- */}
        <div className="grid gap-5 md:grid-cols-2">
          <Card title="Strengths" icon={CheckCircle2}>
            <List items={f.strengths} icon={CheckCircle2} iconClass="text-success" />
          </Card>
          <Card title="Areas to improve" icon={Target}>
            <List items={f.gaps} icon={Target} iconClass="text-warn" />
          </Card>
        </div>

        <Card title="Recommended study plan" icon={ListChecks}>
          <ol className="space-y-3">
            {f.next.map((t, i) => (
              <li key={i} className="glass-flat flex items-start gap-3.5 rounded-2xl p-3.5 text-sm leading-relaxed text-mist-200">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/25 text-xs font-semibold text-violet-100">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </Card>

        {/* ---- per-question ---- */}
        {questions.length > 0 && (
          <Card title="Question by question" icon={MessageSquareText}>
            <ul className="space-y-2.5">
              {questions.map((q) => (
                <QuestionRow key={q.questionNumber} q={q} />
              ))}
            </ul>
          </Card>
        )}

        {/* ---- integrity ---- */}
        {integrity && (
          <Card title="Interview integrity" icon={Camera}>
            <div className="flex items-start gap-3.5">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] ${TONE_TEXT[integrityTone]}`}>
                <IntegrityIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${TONE_TEXT[integrityTone]}`}>
                  {integrity.status === "clear" ? "No concerns recorded" : integrity.status === "review" ? "Flagged for review" : "Minor notes"}
                </p>
                {integrity.flags?.length > 0 ? (
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-mist-300">
                    {integrity.flags.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-mist-400">You stayed in view, on the page, and answered without pasting. Presence checks ran on your device only.</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {(f.closing || closingMessage) && <p className="px-2 pt-2 text-center text-sm italic text-mist-400">{f.closing || closingMessage}</p>}

        <div className="no-print flex flex-col items-center gap-3 pt-4 sm:flex-row sm:justify-center">
          <button type="button" onClick={onRestart} className="btn-primary">
            Start a new interview
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className="pt-2 text-center text-[11px] leading-relaxed text-mist-600">
          Generated by an AI model for practice and learning. Scores weigh accuracy 40%, understanding 25%, application 20% and clarity 15%, with harder questions counting more. Not a hiring decision.
        </p>
      </main>
    </div>
  );
}
