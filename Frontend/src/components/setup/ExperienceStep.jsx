import StepHeader from "./StepHeader";
import Field from "../ui/Field";
import GlassSelect from "../ui/GlassSelect";
import Segmented from "../ui/Segmented";
import ChipSelect from "../ui/ChipSelect";
import {
  DOMAINS,
  INDUSTRIES,
  WORK_CONTEXTS,
  SYSTEM_SCALES,
  AI_EXPOSURES,
  SKILLS,
  SKILL_LEVELS,
  TOOLS,
  DIFFICULTIES,
  QUESTION_STYLES,
} from "../../data/options";

function Block({ title, description, children }) {
  return (
    <div className="glass rounded-3xl p-5 sm:p-8">
      <h3 className="font-display text-lg font-semibold text-mist-100">{title}</h3>
      {description && <p className="mt-1 text-sm leading-relaxed text-mist-400">{description}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

export default function ExperienceStep({ profile, setField, setSkill, errors }) {
  return (
    <section aria-labelledby="step-experience" className="space-y-5">
      <StepHeader
        title="Your technical background"
        subtitle="Interviewers read a résumé before the call. These answers play that part, so questions match the work you have really done."
      />

      <Block title="Work context" description="Where you work and what you have built, in the terms a hiring panel would ask.">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Primary technical domain" htmlFor="x-domain" required error={errors.domain}>
            <GlassSelect id="x-domain" value={profile.domain} onChange={(v) => setField("domain", v)} options={DOMAINS} placeholder="Select a domain" invalid={Boolean(errors.domain)} />
          </Field>
          <Field label="Current situation" htmlFor="x-work" required error={errors.workContext}>
            <GlassSelect id="x-work" value={profile.workContext} onChange={(v) => setField("workContext", v)} options={WORK_CONTEXTS} placeholder="Select your situation" invalid={Boolean(errors.workContext)} />
          </Field>
          <Field label="Industry background" htmlFor="x-ind" hint="Used to set scenarios in a familiar context">
            <GlassSelect id="x-ind" value={profile.industry} onChange={(v) => setField("industry", v)} options={INDUSTRIES} placeholder="Select an industry" searchable />
          </Field>
          <Field label="Largest system you have worked on" htmlFor="x-scale">
            <GlassSelect id="x-scale" value={profile.systemScale} onChange={(v) => setField("systemScale", v)} options={SYSTEM_SCALES} placeholder="Select a scale" />
          </Field>
          <Field label="Production AI / ML exposure" htmlFor="x-ai" className="sm:col-span-2">
            <GlassSelect id="x-ai" value={profile.aiExposure} onChange={(v) => setField("aiExposure", v)} options={AI_EXPOSURES} placeholder="Select your exposure" />
          </Field>
        </div>
      </Block>

      <Block title="Self-assessment" description="Rate yourself honestly. The interviewer treats these as claims to verify, so inflated ratings only lead to harder questions.">
        <ul className="divide-y divide-white/[0.07]">
          {SKILLS.map((s) => (
            <li key={s.key} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between md:gap-6">
              <div className="min-w-0">
                <p className="text-sm font-medium text-mist-100">{s.label}</p>
                <p className="text-xs text-mist-500">{s.hint}</p>
              </div>
              <div className="w-full md:w-[22rem]">
                <Segmented
                  ariaLabel={`${s.label} skill level`}
                  size="sm"
                  options={SKILL_LEVELS}
                  value={profile.skills[s.key]}
                  onChange={(v) => setSkill(s.key, v)}
                />
              </div>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Tools you have used" description="Select up to 12. Questions will use the tools you know.">
        <ChipSelect ariaLabel="Tools" options={TOOLS} values={profile.tools} onChange={(v) => setField("tools", v)} max={12} />
        <p className="mt-3 text-xs text-mist-500">{profile.tools.length} of 12 selected</p>
      </Block>

      <Block title="How should the interview feel?" description="Tell the interviewer how to pitch the questions.">
        <div className="space-y-6">
          <Field label="Difficulty">
            <Segmented ariaLabel="Difficulty" options={DIFFICULTIES} value={profile.difficulty} onChange={(v) => setField("difficulty", v)} />
            <p className="mt-2 text-xs text-mist-500">{DIFFICULTIES.find((d) => d.value === profile.difficulty)?.hint}</p>
          </Field>
          <Field label="Question style">
            <Segmented ariaLabel="Question style" options={QUESTION_STYLES} value={profile.style} onChange={(v) => setField("style", v)} />
            <p className="mt-2 text-xs text-mist-500">{QUESTION_STYLES.find((d) => d.value === profile.style)?.hint}</p>
          </Field>
          <Field label="Anything the interviewer should know?" htmlFor="x-notes" hint="Optional. For example a topic you want to focus on.">
            <textarea
              id="x-notes"
              value={profile.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="e.g. I'd like to be tested on RAG design and deployment trade-offs."
              className="field-input resize-none leading-relaxed"
            />
            <p className="mt-1 text-right text-[11px] text-mist-600">{profile.notes.length}/300</p>
          </Field>
        </div>
      </Block>
    </section>
  );
}
