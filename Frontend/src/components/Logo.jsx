import AIOrb from "./AIOrb";

export default function Logo({ size = "md", className = "" }) {
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-[15px]" : "text-lg";
  const orb = size === "lg" ? "sm" : "sm";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <AIOrb size={orb} className={size === "sm" ? "!h-6 !w-6" : "!h-7 !w-7"} />
      <span className={`font-display font-bold tracking-tight text-mist-100 ${text}`}>
        Novix <span className="text-violet-300">AI</span>
      </span>
    </div>
  );
}
