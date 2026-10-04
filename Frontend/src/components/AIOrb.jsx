const SIZES = {
  sm: { box: "h-9 w-9", ring: "-inset-[3px]" },
  md: { box: "h-14 w-14", ring: "-inset-[5px]" },
  lg: { box: "h-28 w-28", ring: "-inset-[8px]" },
};

/**
 * Glass sphere that represents the AI interviewer. `active` (thinking)
 * makes it breathe and brightens the rim light.
 */
export default function AIOrb({ size = "md", active = false, className = "" }) {
  const s = SIZES[size] || SIZES.md;

  return (
    <div className={`relative shrink-0 ${s.box} ${className}`} aria-hidden="true">
      {/* soft outer glow */}
      <div
        className={`absolute -inset-3 rounded-full blur-xl transition-opacity duration-700 ${active ? "opacity-90" : "opacity-55"}`}
        style={{ background: "radial-gradient(circle, rgba(154,123,255,0.8), rgba(124,92,252,0) 70%)" }}
      />
      {/* orbiting highlight ring */}
      <div
        className={`absolute ${s.ring} animate-spin-slow rounded-full opacity-80`}
        style={{
          background: "conic-gradient(from 0deg, transparent 0%, rgba(214,200,255,0.8) 14%, transparent 34%, transparent 62%, rgba(154,123,255,0.6) 80%, transparent 100%)",
          WebkitMask: "radial-gradient(closest-side, transparent 86%, #000 88%)",
          mask: "radial-gradient(closest-side, transparent 86%, #000 88%)",
        }}
      />
      {/* sphere */}
      <div
        className={`absolute inset-0 rounded-full ${active ? "animate-breathe" : ""}`}
        style={{
          background:
            "radial-gradient(circle at 30% 24%, #ffffff 0%, #d6c8ff 14%, #8f6bff 42%, #3b1a98 78%, #1a0a52 100%)",
          boxShadow:
            "inset 0 -8px 18px rgba(20,6,70,0.6), inset 0 6px 14px rgba(255,255,255,0.35), 0 0 30px rgba(124,92,252,0.5)",
        }}
      />
      {/* specular glints */}
      <div
        className="absolute left-[18%] top-[12%] h-[34%] w-[44%] rounded-full opacity-80"
        style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.95), rgba(255,255,255,0) 70%)", transform: "rotate(-24deg)" }}
      />
      <div
        className="absolute bottom-[10%] right-[16%] h-[18%] w-[28%] rounded-full opacity-40"
        style={{ background: "radial-gradient(ellipse, rgba(214,200,255,0.9), rgba(214,200,255,0) 70%)" }}
      />
    </div>
  );
}
