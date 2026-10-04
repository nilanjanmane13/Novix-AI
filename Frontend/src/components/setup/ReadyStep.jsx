import { useRef, useState } from "react";
import { Briefcase, GraduationCap, Layers, Gauge, MessagesSquare, Clock, Camera, ScrollText } from "lucide-react";
import StepHeader from "./StepHeader";
import Checkbox from "../ui/Checkbox";
import { SKILLS, EXPERIENCE_BANDS } from "../../data/options";
import { TERMS, TERMS_VERSION } from "../../data/terms";

const LEVEL_WIDTH = { none: 0, basic: 33, working: 66, advanced: 100 };
const LEVEL_LABEL = { none: "None", basic: "Basic", working: "Working", advanced: "Advanced" };

const initials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="glass-flat rounded-2xl p-4">
      <Icon className="h-4 w-4 text-violet-300" aria-hidden="true" />
      <p className="mt-3 font-display text-lg font-bold leading-tight text-mist-100 sm:text-xl">{value}</p>
      <p className="mt-1.5 text-xs text-mist-400">{label}</p>
    </div>
  );
}

export default function ReadyStep({ profile, counts, focusTopics, accepted, onAccept, showTermsError }) {
  const [scrolledEnd, setScrolledEnd] = useState(false);
  const termsRef = useRef(null);
  const exp = EXPERIENCE_BANDS.find((b) => b.value === profile.experience);
  const ratedSkills = SKILLS.filter((s) => profile.skills[s.key] && profile.skills[s.key] !== "none");

  const onScroll = (e) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 12) setScrolledEnd(true);
  };

  return (
    <section aria-labelledby="step-ready" className="space-y-5">
      <StepHeader
        title="Review and confirm"
        subtitle="This is the briefing the interviewer receives. Check it over, then accept the interview terms to continue."
      />

      {/* candidate card */}
      <div className="glass-strong overflow-hidden rounded-[2rem]">
        <div
          className="relative px-5 py-6 sm:px-8 sm:py-8"
          style={{ background: "radial-gradient(120% 140% at 0% 0%, rgba(124,92,252,0.35), transparent 60%)" }}
        >
          <div className="flex items-center gap-4 sm:gap-5">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl font-display text-xl font-bold text-white sm:h-20 sm:w-20 sm:text-2xl"
              style={{
                background: "linear-gradient(145deg, #c4b2ff, #6a3ff0 60%, #3a1a9c)",
                boxShadow: "inset 0 2px 0 rgba(255,255,255,0.5), 0 14px 30px -10px rgba(124,92,252,0.9)",
              }}
              aria-hidden="true"
            >
              {initials(profile.name)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-display text-xl font-bold text-mist-100 sm:text-2xl">{profile.name}</h3>
              <p className="mt-0.5 truncate text-sm text-violet-200">{profile.role}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="pill">
                  <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
                  {exp?.label}
                </span>
                <span className="pill">
                  <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                  {profile.educationLevel}
                  {profile.fieldOfStudy ? ` · ${profile.fieldOfStudy}` : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-6">
          <Stat icon={Layers} label="Topics in scope" value={counts.confident + counts.revising + counts.skipped} />
          <Stat icon={Gauge} label="Difficulty" value={profile.difficulty} />
          <Stat icon={MessagesSquare} label="Question style" value={profile.style} />
          <Stat icon={Clock} label="Minimum questions" value="10" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* focus */}
        <div className="glass rounded-3xl p-5 sm:p-6">
          <h3 className="font-display text-base font-semibold text-mist-100">Interview focus</h3>
          <p className="mt-1 text-xs leading-relaxed text-mist-500">Topics the interviewer will start with, in order.</p>
          <ol className="mt-4 space-y-2">
            {focusTopics.slice(0, 5).map((t, i) => (
              <li key={t} className="glass-flat flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-mist-200">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/25 text-[11px] font-semibold text-violet-100">{i + 1}</span>
                <span className="truncate">{t}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="pill !text-success">{counts.confident} confident</span>
            <span className="pill !text-warn">{counts.revising} need revision</span>
            <span className="pill">{counts.skipped} not covered</span>
          </div>
        </div>

        {/* background */}
        <div className="glass rounded-3xl p-5 sm:p-6">
          <h3 className="font-display text-base font-semibold text-mist-100">Background</h3>
          <dl className="mt-4 space-y-2.5 text-sm">
            {[
              ["Domain", profile.domain],
              ["Situation", profile.workContext],
              ["Industry", profile.industry],
              ["Largest system", profile.systemScale],
              ["AI exposure", profile.aiExposure],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 border-b border-white/[0.06] pb-2.5 last:border-0 last:pb-0">
                  <dt className="shrink-0 text-mist-500">{k}</dt>
                  <dd className="text-right text-mist-200">{v}</dd>
                </div>
              ))}
          </dl>
          {profile.tools.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {profile.tools.map((t) => (
                <span key={t} className="pill !px-2.5 !py-0.5 !text-[11px]">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {ratedSkills.length > 0 && (
        <div className="glass rounded-3xl p-5 sm:p-6">
          <h3 className="font-display text-base font-semibold text-mist-100">Self-rated skills</h3>
          <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {ratedSkills.map((s) => (
              <div key={s.key}>
                <div className="flex justify-between text-xs">
                  <span className="text-mist-300">{s.label}</span>
                  <span className="text-mist-500">{LEVEL_LABEL[profile.skills[s.key]]}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-300 to-violet-500" style={{ width: `${LEVEL_WIDTH[profile.skills[s.key]]}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.notes.trim() && (
        <div className="glass rounded-3xl p-5 sm:p-6">
          <h3 className="font-display text-base font-semibold text-mist-100">Your note to the interviewer</h3>
          <p className="mt-2 text-sm italic leading-relaxed text-mist-300">“{profile.notes.trim()}”</p>
        </div>
      )}

      {/* terms */}
      <div className="glass-strong rounded-3xl p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="glass-flat flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
            <ScrollText className="h-5 w-5 text-violet-200" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-mist-100">Interview terms and conditions</h3>
            <p className="mt-0.5 text-xs text-mist-500">Version {TERMS_VERSION} · what you agree to when you start</p>
          </div>
        </div>

        <div
          ref={termsRef}
          onScroll={onScroll}
          tabIndex={0}
          role="region"
          aria-label="Terms and conditions, scrollable"
          className="scroll-thin glass-flat mt-4 max-h-64 space-y-4 overflow-y-auto rounded-2xl p-4 text-[13px] leading-relaxed text-mist-300 sm:max-h-72 sm:p-5"
        >
          {TERMS.map((t) => (
            <div key={t.title}>
              <h4 className="font-semibold text-mist-100">{t.title}</h4>
              <p className="mt-1">{t.body}</p>
            </div>
          ))}
        </div>
        {!scrolledEnd && <p className="mt-2 text-[11px] text-mist-600">Scroll to read all terms.</p>}

        <div className="mt-4">
          <Checkbox id="accept-terms" checked={accepted} onChange={onAccept} invalid={showTermsError && !accepted}>
            I have read and agree to the terms above. I understand that my camera and microphone must stay on, that presence is monitored on my device, and that my answers are processed by an AI service.
          </Checkbox>
          {showTermsError && !accepted && (
            <p role="alert" className="mt-1.5 flex items-center gap-1.5 px-3.5 text-xs text-danger">
              <Camera className="h-3.5 w-3.5" aria-hidden="true" /> Accept the terms to continue.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
