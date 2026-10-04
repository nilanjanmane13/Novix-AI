import { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Camera, Check, Loader2, Mic, ScanFace, Video } from "lucide-react";
import Logo from "../components/Logo";
import CameraTile from "../components/CameraTile";
import MicMeter from "../components/MicMeter";
import { useMicLevel } from "../hooks/useMicLevel";
import { useFaceMonitor } from "../hooks/useFaceMonitor";

function Row({ icon: Icon, title, detail, state }) {
  // state: "done" | "wait" | "todo" | "warn"
  return (
    <li className="glass-flat flex items-center gap-3.5 rounded-2xl p-3.5">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          state === "done" ? "bg-success/20 text-success" : state === "warn" ? "bg-warn/20 text-warn" : "bg-white/[0.07] text-mist-400"
        }`}
      >
        {state === "done" ? <Check className="h-4 w-4" strokeWidth={3} /> : state === "wait" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-mist-100">{title}</p>
        <p className="text-xs leading-relaxed text-mist-400">{detail}</p>
      </div>
    </li>
  );
}

export default function DeviceCheck({ candidateName, media, onBack, onStart }) {
  const videoRef = useRef(null);
  const { status, stream, message, enable, isReady } = media;
  const { level, heard } = useMicLevel(stream);
  const face = useFaceMonitor({ videoRef, enabled: isReady });

  const faceOk = face.status === "ok" || face.status === "unavailable";
  const allGood = isReady && heard && faceOk;
  const first = candidateName ? candidateName.split(" ")[0] : "";

  const cameraState = isReady ? "done" : status === "requesting" ? "wait" : "todo";
  const micState = !isReady ? "todo" : heard ? "done" : "wait";
  const faceState = !isReady ? "todo" : face.status === "ok" ? "done" : face.status === "unavailable" ? "warn" : face.status === "multiple" ? "warn" : "wait";

  const failed = ["denied", "unavailable", "insecure", "lost"].includes(status);

  return (
    <div className="page-pad min-h-dvh pb-36">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 sm:px-8">
        <div className="glass rounded-full py-2 pl-3 pr-5">
          <Logo size="sm" />
        </div>
        <span className="text-xs text-mist-500">Device check</span>
      </header>

      <main className="mx-auto mt-8 w-full max-w-5xl px-4 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <h1 className="font-display text-[1.75rem] font-bold leading-tight tracking-tight sm:text-4xl">
            {first ? `Almost there, ${first}.` : "Almost there."}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist-400 sm:text-[15px]">
            A working camera and microphone are required for the whole interview. Sit facing the camera in good light, then say a few words so we can hear you.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <div className="glass-strong overflow-hidden rounded-[2rem]">
            <div className="relative aspect-[4/3] sm:aspect-video">
              {isReady ? (
                <CameraTile ref={videoRef} stream={stream} className="h-full w-full">
                  {face.box && (
                    <div
                      className="pointer-events-none absolute rounded-2xl border-2 border-success/80 shadow-[0_0_24px_rgba(67,219,168,0.35)] transition-all duration-300"
                      style={{ left: `${(1 - face.box.x - face.box.w) * 100}%`, top: `${face.box.y * 100}%`, width: `${face.box.w * 100}%`, height: `${face.box.h * 100}%` }}
                    />
                  )}
                </CameraTile>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                  <span className="glass-flat flex h-16 w-16 items-center justify-center rounded-3xl">
                    {status === "requesting" ? <Loader2 className="h-7 w-7 animate-spin text-violet-300" /> : <Camera className="h-7 w-7 text-violet-300" />}
                  </span>
                  <div>
                    <p className="font-display text-base font-semibold text-mist-100">
                      {status === "requesting" ? "Waiting for your permission…" : "Camera preview"}
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-mist-400">
                      {message || "Allow camera and microphone access when your browser asks."}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <Mic className="h-4 w-4 text-violet-300" aria-hidden="true" />
                <MicMeter level={isReady ? level : 0} />
              </div>
              <span className="text-xs text-mist-400">{isReady ? (heard ? "Microphone heard" : "Say a few words") : "Microphone off"}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <ul className="space-y-3" aria-label="Requirements">
              <Row icon={Video} title="Camera on" detail={isReady ? "Live video is working." : "Required for the entire interview."} state={cameraState} />
              <Row icon={Mic} title="Microphone working" detail={heard ? "Your voice is coming through." : "Speak normally to confirm."} state={micState} />
              <Row
                icon={ScanFace}
                title="You are in frame"
                detail={
                  face.status === "ok"
                    ? "One person detected, centred in view."
                    : face.status === "multiple"
                    ? "More than one person is visible. Only you should be in frame."
                    : face.status === "unavailable"
                    ? "Automatic presence check is unavailable on this device. You can still continue."
                    : "Face the camera so we can see you."
                }
                state={faceState}
              />
            </ul>

            {failed && (
              <div role="alert" className="glass rounded-2xl p-4 text-sm leading-relaxed text-mist-200" style={{ boxShadow: "inset 0 0 0 1px rgba(245,112,124,0.35)" }}>
                {message}
              </div>
            )}

            <button type="button" onClick={enable} disabled={status === "requesting"} className={`${isReady ? "btn-glass" : "btn-primary"} w-full`}>
              {status === "requesting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
              {isReady ? "Restart devices" : failed ? "Try again" : "Enable camera and microphone"}
            </button>

            <p className="text-xs leading-relaxed text-mist-500">
              Video and audio are never recorded or uploaded. They are processed only on your device to show the preview and check presence.
            </p>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-6">
        <div className="glass-strong mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-full p-2">
          <button type="button" onClick={onBack} className="btn-glass !px-5 !py-2.5">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden xs:inline">Back</span>
          </button>
          <button type="button" onClick={() => onStart(face.getSummary())} disabled={!allGood} className="btn-primary !px-6 !py-2.5">
            Begin interview
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
