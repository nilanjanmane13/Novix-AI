/**
 * Fixed, GPU-friendly backdrop: deep black with slow-drifting violet light
 * pools. The glass panes above it blur and refract these colours, which is
 * what gives the "liquid glass" look. Pure CSS (transform only), so it stays
 * smooth on phones. Respects prefers-reduced-motion via index.css.
 */
export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950" aria-hidden="true">
      <div
        className="absolute -left-[18vw] -top-[22vh] h-[70vh] w-[70vh] animate-drift-a rounded-full opacity-80"
        style={{ background: "radial-gradient(circle at 40% 40%, rgba(124,92,252,0.55), rgba(124,92,252,0) 68%)" }}
      />
      <div
        className="absolute -right-[16vw] top-[18vh] h-[78vh] w-[78vh] animate-drift-b rounded-full opacity-70"
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(88,40,200,0.5), rgba(88,40,200,0) 66%)" }}
      />
      <div
        className="absolute -bottom-[30vh] left-[18vw] h-[70vh] w-[90vh] animate-drift-a rounded-full opacity-60"
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(154,90,255,0.4), rgba(154,90,255,0) 65%)" }}
      />
      {/* faint grid + vignette keep the glass legible */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.028) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 20%, transparent 75%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 120%, rgba(5,3,10,0.9), rgba(5,3,10,0) 60%)" }}
      />
    </div>
  );
}
