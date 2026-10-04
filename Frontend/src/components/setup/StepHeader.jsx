/** Consistent heading block for every setup step. */
export default function StepHeader({ title, subtitle, action }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="font-display text-[1.65rem] font-bold leading-tight tracking-tight text-mist-100 sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist-400 sm:text-[15px]">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
