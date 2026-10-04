import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Camera, ChartNoAxesColumn, MessagesSquare, ShieldCheck } from "lucide-react";
import AIOrb from "../components/AIOrb";

const FEATURES = [
  { icon: MessagesSquare, title: "Adaptive questioning", text: "Every follow-up responds to the quality of your last answer." },
  { icon: Camera, title: "Live presence check", text: "On-device face detection keeps the session honest. Video never leaves your browser." },
  { icon: ChartNoAxesColumn, title: "Evidence-based scoring", text: "A report card built from how well you actually answered, question by question." },
];

/** Glass card that floats at a given depth and reacts to the pointer. */
function Layer({ x, y, depth, className = "", style, children }) {
  const tx = useTransform(x, (v) => v * depth);
  const ty = useTransform(y, (v) => v * depth * 0.7);
  return (
    <motion.div style={{ x: tx, y: ty, translateZ: depth * 3, ...style }} className={`absolute ${className}`}>
      {children}
    </motion.div>
  );
}

function ScoreRing({ value = 82 }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
      <defs>
        <linearGradient id="lr" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e6dcff" />
          <stop offset="1" stopColor="#7c5cfc" />
        </linearGradient>
      </defs>
      <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="7" />
      <circle
        cx="38"
        cy="38"
        r={r}
        fill="none"
        stroke="url(#lr)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        transform="rotate(-90 38 38)"
      />
      <text x="38" y="43" textAnchor="middle" className="fill-white font-display" fontSize="19" fontWeight="700">
        {value}
      </text>
    </svg>
  );
}

function Scene() {
  const ref = useRef(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 90, damping: 18, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 90, damping: 18, mass: 0.6 });

  const rotateY = useTransform(sx, [-1, 1], [-14, 14]);
  const rotateX = useTransform(sy, [-1, 1], [10, -10]);
  const lx = useTransform(sx, (v) => v * 22);
  const ly = useTransform(sy, (v) => v * 16);

  useEffect(() => {
    const onMove = (e) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      px.set(Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2)));
      py.set(Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2)));
    };
    const onLeave = () => {
      px.set(0);
      py.set(0);
    };
    // Phones: a gentle tilt from the gyroscope where available.
    const onTilt = (e) => {
      if (e.gamma == null) return;
      px.set(Math.max(-1, Math.min(1, e.gamma / 30)));
      py.set(Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 30)));
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("deviceorientation", onTilt);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, [px, py]);

  return (
    <div ref={ref} className="stage relative mx-auto h-[360px] w-full max-w-[460px] sm:h-[460px] sm:max-w-[560px] lg:h-[540px]">
      <motion.div style={{ rotateX, rotateY }} className="preserve-3d absolute inset-0">
        {/* back plate */}
        <Layer x={lx} y={ly} depth={0.4} className="inset-[8%] rounded-[2.2rem] glass" style={{ opacity: 0.8 }}>
          <div
            className="h-full w-full rounded-[2.2rem]"
            style={{ background: "radial-gradient(circle at 30% 20%, rgba(154,123,255,0.28), transparent 60%)" }}
          />
        </Layer>

        {/* centre orb */}
        <Layer x={lx} y={ly} depth={1.2} className="left-1/2 top-1/2 -ml-[70px] -mt-[70px] sm:-ml-[92px] sm:-mt-[92px]">
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}>
            <AIOrb size="lg" active className="!h-[140px] !w-[140px] sm:!h-[184px] sm:!w-[184px]" />
          </motion.div>
        </Layer>

        {/* question card */}
        <Layer x={lx} y={ly} depth={2.2} className="left-0 top-[6%] w-[62%] sm:left-[-2%] sm:w-[58%]">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            className="glass-strong rounded-2xl p-3.5 sm:p-4"
          >
            <p className="text-[10px] font-medium text-violet-300 sm:text-[11px]">Question 4 of 10</p>
            <p className="mt-1.5 font-display text-[13px] font-semibold leading-snug text-mist-100 sm:text-[15px]">
              Why do similar sentences land close together in embedding space?
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[40%] rounded-full bg-gradient-to-r from-violet-300 to-violet-500" />
            </div>
          </motion.div>
        </Layer>

        {/* score card */}
        <Layer x={lx} y={ly} depth={3} className="bottom-[4%] right-0 sm:right-[-1%]">
          <motion.div
            animate={{ y: [0, 9, 0] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="glass-strong flex items-center gap-3 rounded-2xl p-3 pr-4"
          >
            <ScoreRing value={82} />
            <div>
              <p className="text-[11px] text-mist-400">Overall score</p>
              <p className="font-display text-sm font-semibold text-mist-100">Strong</p>
            </div>
          </motion.div>
        </Layer>

        {/* presence chip */}
        <Layer x={lx} y={ly} depth={2.6} className="right-[2%] top-[26%] sm:right-[-2%]">
          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="glass flex items-center gap-2 rounded-full px-3.5 py-2"
          >
            <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
            <span className="text-[11px] font-medium text-mist-100 sm:text-xs">Presence verified</span>
          </motion.div>
        </Layer>

        {/* mic bars */}
        <Layer x={lx} y={ly} depth={1.8} className="bottom-[10%] left-[3%]">
          <div className="glass flex h-12 items-end gap-1 rounded-2xl px-3.5 py-3" aria-hidden="true">
            {[40, 70, 50, 90, 60, 80, 45].map((h, i) => (
              <motion.span
                key={i}
                className="w-1 rounded-full bg-violet-300"
                animate={{ height: [`${h * 0.35}%`, `${h}%`, `${h * 0.35}%`] }}
                transition={{ duration: 1.2 + i * 0.12, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </div>
        </Layer>
      </motion.div>
    </div>
  );
}

export default function Landing({ onStart }) {
  return (
    <div className="page-pad relative flex min-h-dvh flex-col overflow-x-clip">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 sm:px-10">
        <div className="glass flex items-center gap-2.5 rounded-full py-2 pl-3 pr-5">
          <AIOrb size="sm" className="!h-6 !w-6" />
          <span className="font-display text-[15px] font-bold tracking-tight">
            Novix <span className="text-violet-300">AI</span>
          </span>
        </div>
        <button type="button" onClick={onStart} className="btn-glass hidden !py-2.5 text-[13px] sm:inline-flex">
          Begin setup
        </button>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-6 px-5 pb-16 pt-8 sm:px-10 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:pt-4">
        <div className="text-center lg:text-left">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="pill mx-auto lg:mx-0"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_8px_2px_rgba(67,219,168,0.7)]" aria-hidden="true" />
            Adaptive AI technical interviews
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="text-gradient mt-5 font-display text-[clamp(3.6rem,13vw,7.5rem)] font-extrabold leading-[0.92] tracking-[-0.045em]"
          >
            Novix AI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-mist-300 sm:text-base lg:mx-0"
          >
            A technical interviewer that listens to every answer, adjusts the next question to match, and
            finishes with a scored report card.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-col items-center gap-4 lg:items-start"
          >
            <button type="button" onClick={onStart} className="btn-primary w-full max-w-xs !px-8 !py-3.5 text-[15px] sm:w-auto sm:max-w-none">
              Start your interview
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <p className="text-xs text-mist-500">10+ questions · about 20 minutes · camera and microphone required</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <Scene />
        </motion.div>
      </main>

      <section className="mx-auto w-full max-w-7xl px-5 pb-12 sm:px-10" aria-label="What you get">
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="glass rounded-3xl p-5 sm:p-6">
              <span className="glass-flat flex h-10 w-10 items-center justify-center rounded-2xl">
                <Icon className="h-5 w-5 text-violet-200" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-display text-base font-semibold text-mist-100">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-mist-400">{text}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-mist-600">
          A study project. Scores come from an AI model and are guidance for practice, not a hiring decision.
        </p>
      </section>
    </div>
  );
}
