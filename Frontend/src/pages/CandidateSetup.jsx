import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Logo from "../components/Logo";
import StepIndicator from "../components/ui/StepIndicator";
import ProfileStep from "../components/setup/ProfileStep";
import ExperienceStep from "../components/setup/ExperienceStep";
import CurriculumStep, { MIN_RATED_TOPICS } from "../components/setup/CurriculumStep";
import ReadyStep from "../components/setup/ReadyStep";
import { CURRICULUM } from "../data/curriculum";
import { EXPERIENCE_BANDS, SKILLS } from "../data/options";
import { SAMPLE_PROFILE, SAMPLE_TOPIC_STATUS } from "../data/sampleCandidate";
import { TERMS_VERSION } from "../data/terms";

const STEPS = [{ label: "Profile" }, { label: "Experience" }, { label: "Curriculum" }, { label: "Ready" }];
const DRAFT_KEY = "novix.setup.draft";

const emptySkills = () => Object.fromEntries(SKILLS.map((s) => [s.key, "none"]));

const emptyProfile = {
  name: "",
  role: "",
  experience: "",
  educationLevel: "",
  fieldOfStudy: "",
  domain: "",
  industry: "",
  workContext: "",
  systemScale: "",
  aiExposure: "",
  skills: emptySkills(),
  tools: [],
  difficulty: "Standard",
  style: "Mixed",
  notes: "",
};

const dayTitle = (day) => CURRICULUM.days.find((d) => d.day === day)?.title || `Day ${day}`;

function loadDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return {
      step: Math.min(4, Math.max(1, Number(d.step) || 1)),
      profile: { ...emptyProfile, ...d.profile, skills: { ...emptySkills(), ...(d.profile?.skills || {}) } },
      statusByDay: d.statusByDay || {},
    };
  } catch {
    return null;
  }
}

/** Converts the form into the candidate object the backend expects. */
function buildCandidatePayload(profile, statusByDay) {
  const band = EXPERIENCE_BANDS.find((b) => b.value === profile.experience);
  const missions = Object.entries(statusByDay).map(([dayStr, status]) => {
    const day = Number(dayStr);
    const title = dayTitle(day);
    if (status === "skipped") return { day, title, skipped: true };
    if (status === "revising") return { day, title, passed: true, attempts: 3 };
    return { day, title, passed: true, attempts: 1 };
  });
  const confident = missions.filter((m) => m.passed && m.attempts === 1).length;

  return {
    member: {
      id: `CAND-${Date.now().toString().slice(-6)}`,
      name: profile.name.trim(),
      jobRole: profile.role,
      yearsExperience: band ? band.years : 0,
      education: [profile.educationLevel, profile.fieldOfStudy].filter(Boolean).join(", "),
      status: "COMPLETED",
    },
    profile: {
      domain: profile.domain,
      industry: profile.industry,
      workContext: profile.workContext,
      systemScale: profile.systemScale,
      aiExposure: profile.aiExposure,
      skills: profile.skills,
      tools: profile.tools,
      difficulty: profile.difficulty,
      style: profile.style,
      notes: profile.notes.trim(),
    },
    missions,
    signals: {
      missionsCompleted: missions.filter((m) => m.passed).length,
      missionsFirstTry: confident,
    },
    consent: { termsVersion: TERMS_VERSION, acceptedAt: new Date().toISOString() },
  };
}

export default function CandidateSetup({ onBack, onReady }) {
  const [draft] = useState(loadDraft);
  const [step, setStep] = useState(draft?.step || 1);
  const [profile, setProfile] = useState(draft?.profile || emptyProfile);
  const [statusByDay, setStatusByDay] = useState(draft?.statusByDay || {});
  const [accepted, setAccepted] = useState(false);
  const [tried, setTried] = useState({});

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ step, profile, statusByDay }));
    } catch {
      /* storage may be unavailable; not fatal */
    }
  }, [step, profile, statusByDay]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const setField = (key, value) => setProfile((p) => ({ ...p, [key]: value }));
  const setSkill = (key, value) => setProfile((p) => ({ ...p, skills: { ...p.skills, [key]: value } }));

  const rated = Object.keys(statusByDay).length;

  const errors = {
    1: {
      ...(profile.name.trim().length < 2 && { name: "Enter your full name." }),
      ...(!profile.role && { role: "Choose a target role." }),
      ...(!profile.experience && { experience: "Choose your experience level." }),
      ...(!profile.educationLevel && { educationLevel: "Choose your education." }),
    },
    2: {
      ...(!profile.domain && { domain: "Choose a domain." }),
      ...(!profile.workContext && { workContext: "Choose your situation." }),
    },
    3: {},
    4: {},
  };
  const stepValid = {
    1: Object.keys(errors[1]).length === 0,
    2: Object.keys(errors[2]).length === 0,
    3: rated >= MIN_RATED_TOPICS,
    4: accepted,
  };

  const counts = useMemo(() => {
    const c = { confident: 0, revising: 0, skipped: 0 };
    Object.values(statusByDay).forEach((s) => {
      if (c[s] !== undefined) c[s] += 1;
    });
    return c;
  }, [statusByDay]);

  const payload = useMemo(() => buildCandidatePayload(profile, statusByDay), [profile, statusByDay]);

  // Interview order shown on the Ready step mirrors the backend plan:
  // one confident warm-up, revision topics, remaining confident, then the rest.
  const focusTopics = useMemo(() => {
    const byStatus = (s) => Object.entries(statusByDay).filter(([, v]) => v === s).map(([d]) => Number(d)).sort((a, b) => a - b);
    const confident = byStatus("confident");
    const ordered = [confident[0], ...byStatus("revising"), ...confident.slice(1), ...byStatus("skipped")].filter((d) => d !== undefined);
    return ordered.map(dayTitle);
  }, [statusByDay]);

  const next = () => {
    setTried((t) => ({ ...t, [step]: true }));
    if (!stepValid[step]) return;
    if (step < 4) setStep(step + 1);
    else onReady(payload);
  };

  const back = () => (step === 1 ? onBack() : setStep(step - 1));

  const loadSample = () => {
    setProfile({ ...emptyProfile, ...SAMPLE_PROFILE, skills: { ...emptySkills(), ...SAMPLE_PROFILE.skills } });
    setStatusByDay({ ...SAMPLE_TOPIC_STATUS });
    setTried({});
  };

  const visibleErrors = tried[step] ? errors[step] : {};

  return (
    <div className="page-pad relative min-h-dvh pb-32">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 sm:px-8">
        <button type="button" onClick={onBack} aria-label="Back to home" className="glass rounded-full py-2 pl-3 pr-5">
          <Logo size="sm" />
        </button>
        <span className="text-xs text-mist-500">Step {step} of 4</span>
      </header>

      <main className="mx-auto mt-6 w-full max-w-4xl px-4 sm:px-8">
        <StepIndicator steps={STEPS} current={step} />

        <div className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 1 && <ProfileStep profile={profile} setField={setField} errors={visibleErrors} onLoadSample={loadSample} />}
              {step === 2 && <ExperienceStep profile={profile} setField={setField} setSkill={setSkill} errors={visibleErrors} />}
              {step === 3 && <CurriculumStep statusByDay={statusByDay} setStatusByDay={setStatusByDay} />}
              {step === 4 && (
                <ReadyStep
                  profile={profile}
                  counts={counts}
                  focusTopics={focusTopics}
                  accepted={accepted}
                  onAccept={setAccepted}
                  showTermsError={Boolean(tried[4])}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-6">
        <div className="glass-strong mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-full p-2">
          <button type="button" onClick={back} className="btn-glass !px-5 !py-2.5">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden xs:inline">Back</span>
          </button>
          {step === 3 && rated < MIN_RATED_TOPICS && (
            <span className="text-[11px] leading-tight text-mist-400 sm:text-xs">Rate {MIN_RATED_TOPICS - rated} more topic{MIN_RATED_TOPICS - rated === 1 ? "" : "s"}</span>
          )}
          <button type="button" onClick={next} className={`btn-primary !px-6 !py-2.5 ${!stepValid[step] && tried[step] ? "opacity-70" : ""}`}>
            {step < 4 ? "Continue" : "Continue to device check"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
