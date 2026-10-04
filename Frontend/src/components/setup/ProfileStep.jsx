import { Wand2 } from "lucide-react";
import StepHeader from "./StepHeader";
import Field from "../ui/Field";
import GlassSelect from "../ui/GlassSelect";
import { ROLES, EXPERIENCE_BANDS, EDUCATION_LEVELS, FIELDS_OF_STUDY } from "../../data/options";

export default function ProfileStep({ profile, setField, errors, onLoadSample }) {
  return (
    <section aria-labelledby="step-profile">
      <StepHeader
        title="Build your candidate profile"
        subtitle="Your role and experience decide how the interviewer words each question and how deep it goes."
        action={
          <button type="button" onClick={onLoadSample} className="btn-glass shrink-0 !py-2.5 text-[13px]">
            <Wand2 className="h-4 w-4 text-violet-300" aria-hidden="true" />
            Load sample profile
          </button>
        }
      />

      <div className="glass rounded-3xl p-5 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Full name" htmlFor="p-name" required error={errors.name} className="sm:col-span-2">
            <input
              id="p-name"
              value={profile.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Enter your full name"
              autoComplete="name"
              maxLength={60}
              aria-invalid={Boolean(errors.name) || undefined}
              className="field-input"
            />
          </Field>

          <Field label="Target job role" htmlFor="p-role" required error={errors.role}>
            <GlassSelect
              id="p-role"
              value={profile.role}
              onChange={(v) => setField("role", v)}
              options={ROLES}
              placeholder="Select a role"
              searchable
              invalid={Boolean(errors.role)}
            />
          </Field>

          <Field label="Years of experience" htmlFor="p-exp" required error={errors.experience}>
            <GlassSelect
              id="p-exp"
              value={profile.experience}
              onChange={(v) => setField("experience", v)}
              options={EXPERIENCE_BANDS}
              placeholder="Select experience"
              invalid={Boolean(errors.experience)}
            />
          </Field>

          <Field label="Highest education" htmlFor="p-edu" required error={errors.educationLevel}>
            <GlassSelect
              id="p-edu"
              value={profile.educationLevel}
              onChange={(v) => setField("educationLevel", v)}
              options={EDUCATION_LEVELS}
              placeholder="Select a qualification"
              invalid={Boolean(errors.educationLevel)}
            />
          </Field>

          <Field label="Field of study" htmlFor="p-field" hint="Optional">
            <GlassSelect
              id="p-field"
              value={profile.fieldOfStudy}
              onChange={(v) => setField("fieldOfStudy", v)}
              options={FIELDS_OF_STUDY}
              placeholder="Select a field"
              searchable
            />
          </Field>
        </div>
      </div>
    </section>
  );
}
