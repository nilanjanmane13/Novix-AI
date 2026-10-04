import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Camera, Home, Loader2, LogOut, Mic, SendHorizontal, ShieldAlert, UserX, Users } from "lucide-react";
import Logo from "../components/Logo";
import AIOrb from "../components/AIOrb";
import ChatBubble from "../components/ChatBubble";
import QuestionProgress from "../components/QuestionProgress";
import Timer from "../components/Timer";
import LoadingState from "../components/LoadingState";
import ErrorMessage from "../components/ErrorMessage";
import ConfirmModal from "../components/ConfirmModal";
import CameraTile from "../components/CameraTile";
import MicMeter from "../components/MicMeter";
import PresenceBadge from "../components/PresenceBadge";
import { useMicLevel } from "../hooks/useMicLevel";
import { useFaceMonitor } from "../hooks/useFaceMonitor";
import { startInterview, sendAnswer, endInterview, MIN_QUESTIONS } from "../services/interviewApi";

const MAX_CHARS = 4000;

export default function Interview({ candidate, sessionId, persisted, onPersist, onComplete, onHome, media }) {
  const [messages, setMessages] = useState(persisted?.messages || []);
  const [questionNumber, setQuestionNumber] = useState(persisted?.questionNumber || 0);
  const [totalQuestions, setTotalQuestions] = useState(persisted?.totalQuestions || MIN_QUESTIONS);
  const [startedAt] = useState(persisted?.startedAt || Date.now());
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false); // waiting for the AI
  const [busyLabel, setBusyLabel] = useState("");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState("");
  const [tabAway, setTabAway] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const videoRef = useRef(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const startedRef = useRef(Boolean(persisted?.messages?.length));
  const noticeTimer = useRef(null);
  const counters = useRef({ tabSwitches: persisted?.counters?.tabSwitches || 0, pasteAttempts: persisted?.counters?.pasteAttempts || 0 });
  const faceBase = useRef(persisted?.face || {});

  const { stream, status: mediaStatus, message: mediaMessage, enable, isReady, getInterruptions } = media;
  const { level } = useMicLevel(stream);
  const face = useFaceMonitor({ videoRef, enabled: isReady });

  const devicesBlocked = !isReady;
  const locked = busy || devicesBlocked;

  /* ---- integrity numbers sent to the backend (monotonic) ---- */
  const getFaceSummary = face.getSummary;
  const getIntegrity = useCallback(() => {
    const f = getFaceSummary();
    const b = faceBase.current;
    return {
      faceMissingEvents: Math.max(f.faceMissingEvents, 0) + (b.faceMissingEvents || 0),
      faceMissingSeconds: f.faceMissingSeconds + (b.faceMissingSeconds || 0),
      multipleFaceEvents: f.multipleFaceEvents + (b.multipleFaceEvents || 0),
      tabSwitches: counters.current.tabSwitches,
      pasteAttempts: counters.current.pasteAttempts,
      deviceInterruptions: getInterruptions(),
      monitoringAvailable: f.monitoringAvailable,
    };
  }, [getFaceSummary, getInterruptions]);

  /* ---- persist so a refresh can resume ---- */
  useEffect(() => {
    onPersist?.({ messages, questionNumber, totalQuestions, startedAt, counters: counters.current, face: getIntegrity() });
  }, [messages, questionNumber, totalQuestions, startedAt, onPersist, getIntegrity]);

  /* ---- keep the newest message in view ---- */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, busy, error]);

  /* ---- focus the answer box when it is your turn ---- */
  useEffect(() => {
    if (!locked && messages.length) textareaRef.current?.focus({ preventScroll: true });
  }, [locked, messages.length]);

  /* ---- tab switching ---- */
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        counters.current.tabSwitches += 1;
        setTabAway(true);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  /* ---- warn before closing the tab mid-interview ---- */
  useEffect(() => {
    const onUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  /* ---- start (once devices are live) ---- */
  const runStart = useCallback(async () => {
    setBusy(true);
    setBusyLabel("Preparing your interview");
    setError(null);
    try {
      const res = await startInterview(sessionId, candidate);
      setMessages([{ id: `ai-${res.questionNumber || 1}`, role: "ai", text: res.reply, q: res.questionNumber || 1 }]);
      setQuestionNumber(res.questionNumber || 1);
      setTotalQuestions(res.totalQuestions || MIN_QUESTIONS);
    } catch (err) {
      startedRef.current = false;
      setError(err);
    } finally {
      setBusy(false);
    }
  }, [sessionId, candidate]);

  useEffect(() => {
    if (!isReady || startedRef.current) return;
    startedRef.current = true;
    runStart();
  }, [isReady, runStart]);

  const flash = (text) => {
    setNotice(text);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 3000);
  };

  /* ---- submit an answer ---- */
  async function submit() {
    const answer = draft.trim();
    if (!answer || locked) return;

    const userMsg = { id: `u-${Date.now()}`, role: "user", text: answer };
    setMessages((m) => [...m, userMsg]);
    setDraft("");
    setBusy(true);
    setBusyLabel("Evaluating your answer");
    setError(null);

    try {
      const res = await sendAnswer(sessionId, answer, getIntegrity());
      if (res.done) {
        setBusyLabel("Preparing your report card");
        onComplete({ closingMessage: res.reply, feedback: res.feedback });
        return;
      }
      setMessages((m) => [...m, { id: `ai-${res.questionNumber}`, role: "ai", text: res.reply, q: res.questionNumber }]);
      setQuestionNumber(res.questionNumber);
      setTotalQuestions(res.totalQuestions || MIN_QUESTIONS);
    } catch (err) {
      // Nothing is lost: put the answer back so it can be sent again.
      setMessages((m) => m.filter((x) => x.id !== userMsg.id));
      setDraft(answer);
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnd() {
    setEndOpen(false);
    setBusy(true);
    setBusyLabel("Preparing your report card");
    setError(null);
    try {
      const res = await endInterview(sessionId, getIntegrity());
      onComplete({ closingMessage: res.reply, feedback: res.feedback });
    } catch (err) {
      setBusy(false);
      setError(err);
    }
  }

  /* ---- copy / paste deterrents ---- */
  const block = (e) => {
    e.preventDefault();
    counters.current.pasteAttempts += 1;
    flash("Copy and paste are disabled during the interview.");
  };
  const onKeyDown = (e) => {
    const key = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && key === "enter") {
      e.preventDefault();
      submit();
    } else if ((e.metaKey || e.ctrlKey) && ["v", "c", "x"].includes(key)) {
      block(e);
    }
  };

  const lastAi = useMemo(() => [...messages].reverse().find((m) => m.role === "ai"), [messages]);
  const retry = error && (error.expired ? onHome : messages.length === 0 ? runStart : draft.trim() ? submit : undefined);
  const canType = !locked && Boolean(lastAi);
  const showPresenceAlert = isReady && (face.status === "missing" || face.status === "multiple");

  return (
    <div className="flex h-dvh flex-col overflow-hidden pt-[env(safe-area-inset-top)]">
      {/* ---------------- top bar ---------------- */}
      <header className="z-20 px-3 pt-3 sm:px-6">
        <div className="glass-strong mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full py-2 pl-4 pr-2 sm:pl-5">
          <button type="button" onClick={() => setLeaveOpen(true)} className="shrink-0" aria-label="Leave interview and return home">
            <Logo size="sm" />
          </button>

          <div className="min-w-0 flex-1 sm:flex sm:justify-center">
            {questionNumber > 0 ? <QuestionProgress current={questionNumber} total={totalQuestions} min={MIN_QUESTIONS} /> : <span className="text-xs text-mist-500">Starting…</span>}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Timer startedAt={startedAt} className="hidden xs:inline" />
            <button type="button" onClick={() => setEndOpen(true)} disabled={busy || messages.length === 0} className="btn-glass !px-3.5 !py-2 text-xs sm:!px-4">
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">End interview</span>
              <span className="sm:hidden">End</span>
            </button>
            <button type="button" onClick={() => setLeaveOpen(true)} aria-label="Home" className="btn-glass hidden !p-2.5 sm:inline-flex">
              <Home className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* ---------------- banners ---------------- */}
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6">
        <AnimatePresence initial={false}>
          {showPresenceAlert && (
            <motion.div
              key="presence"
              role="alert"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div
                className="glass flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ boxShadow: "inset 0 0 0 1px rgba(245,112,124,0.55), 0 0 36px -8px rgba(245,112,124,0.45)", background: "linear-gradient(145deg, rgba(245,112,124,0.2), rgba(245,112,124,0.07))" }}
              >
                {face.status === "missing" ? <UserX className="h-5 w-5 shrink-0 text-danger" aria-hidden="true" /> : <Users className="h-5 w-5 shrink-0 text-warn" aria-hidden="true" />}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-mist-100">
                    {face.status === "missing" ? "Candidate not found in front of the camera" : "More than one person detected"}
                  </p>
                  <p className="text-xs text-mist-300">
                    {face.status === "missing" ? "Return to your seat and face the camera. This is recorded in your report." : "Only the candidate may be in view. This is recorded in your report."}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          {tabAway && (
            <motion.div key="tab" initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: "auto", marginTop: 12 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className="overflow-hidden">
              <button type="button" onClick={() => setTabAway(false)} className="glass flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left">
                <AlertTriangle className="h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
                <span className="text-xs text-mist-200 sm:text-sm">
                  You left the interview tab. Please stay on this page. This is noted in your report. <span className="text-mist-500 underline underline-offset-2">Dismiss</span>
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---------------- body ---------------- */}
      <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-3 px-3 pb-3 pt-3 sm:gap-4 sm:px-6 sm:pb-5 lg:flex-row">
        {/* camera column (a compact strip on phones) */}
        <aside className="glass flex shrink-0 items-center gap-3 rounded-3xl p-2.5 lg:w-[19rem] lg:flex-col lg:items-stretch lg:gap-4 lg:p-4">
          <div
            className={`relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-2xl transition-shadow duration-300 sm:w-36 lg:w-full ${
              showPresenceAlert ? "shadow-[0_0_0_2px_rgba(245,112,124,0.9),0_0_28px_rgba(245,112,124,0.5)]" : "shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
            }`}
          >
            {isReady ? (
              <CameraTile ref={videoRef} stream={stream} className="h-full w-full">
                {face.box && face.status === "ok" && (
                  <div
                    className="pointer-events-none absolute rounded-xl border border-success/70 transition-all duration-300"
                    style={{ left: `${(1 - face.box.x - face.box.w) * 100}%`, top: `${face.box.y * 100}%`, width: `${face.box.w * 100}%`, height: `${face.box.h * 100}%` }}
                  />
                )}
                {showPresenceAlert && (
                  <div className="absolute inset-0 flex items-center justify-center bg-danger/25 backdrop-blur-[2px]">
                    <ShieldAlert className="h-7 w-7 animate-pulse text-white" aria-hidden="true" />
                  </div>
                )}
              </CameraTile>
            ) : (
              <div className="flex h-full items-center justify-center bg-black/40">
                <Camera className="h-6 w-6 text-mist-600" aria-hidden="true" />
              </div>
            )}
            <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-danger" aria-hidden="true" />
              LIVE
            </span>
          </div>

          <div className="min-w-0 flex-1 space-y-2.5 lg:flex-none">
            <PresenceBadge status={isReady ? face.status : "loading"} />
            <div className="flex items-center gap-2.5">
              <Mic className="h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
              <MicMeter level={isReady ? level : 0} className="!h-4" />
            </div>
          </div>

          <div className="hidden space-y-4 border-t border-white/[0.08] pt-4 lg:block">
            <div>
              <p className="text-xs text-mist-500">Candidate</p>
              <p className="mt-0.5 truncate text-sm font-medium text-mist-100">{candidate?.member?.name}</p>
              <p className="truncate text-xs text-mist-400">{candidate?.member?.jobRole}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {candidate?.profile?.difficulty && <span className="pill !px-2.5 !py-0.5 !text-[11px]">{candidate.profile.difficulty}</span>}
              {candidate?.profile?.style && <span className="pill !px-2.5 !py-0.5 !text-[11px]">{candidate.profile.style}</span>}
            </div>
            <ul className="space-y-1.5 text-[11px] leading-relaxed text-mist-500">
              <li>Answer in your own words. Short and precise beats long and vague.</li>
              <li>Saying "I don't know" is fine. Guessing wildly is not rewarded.</li>
              <li>Camera and microphone must stay on. Nothing is recorded or uploaded.</li>
            </ul>
          </div>
        </aside>

        {/* conversation */}
        <section className="glass flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] sm:rounded-[2rem]" aria-label="Interview conversation">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <AIOrb size="sm" active={busy} />
              <div>
                <p className="text-sm font-semibold leading-tight text-mist-100">Novix AI interviewer</p>
                <p className="text-[11px] text-mist-400">{busy ? busyLabel || "Thinking" : devicesBlocked ? "Paused" : "Waiting for your answer"}</p>
              </div>
            </div>
            <span className="hidden text-xs text-mist-500 sm:block">{candidate?.member?.jobRole}</span>
          </div>

          <div ref={scrollRef} className="scroll-thin min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6" role="log" aria-live="polite">
            {messages.length === 0 && !busy && !error && (
              <div className="flex h-full items-center justify-center text-sm text-mist-500">
                {devicesBlocked ? "Enable your camera and microphone to begin." : "Starting…"}
              </div>
            )}
            {messages.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
                <ChatBubble role={m.role} text={m.text} index={m.q} />
              </motion.div>
            ))}
            {busy && (
              <div className="flex items-center gap-3">
                <AIOrb size="sm" active />
                <div className="glass rounded-full px-4 py-2.5">
                  <LoadingState label={busyLabel} />
                </div>
              </div>
            )}
            {error && <ErrorMessage message={error.message} technicalDetail={error.technicalDetail} onRetry={retry} retryLabel={error.expired ? "Start over" : "Try again"} />}
          </div>

          {/* composer */}
          <div className="border-t border-white/[0.08] p-3 sm:p-4">
            <div className="glass-flat rounded-3xl p-2 focus-within:shadow-[0_0_0_1px_rgba(183,161,255,0.6),0_0_0_4px_rgba(124,92,252,0.15)]">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={onKeyDown}
                onPaste={block}
                onCopy={block}
                onCut={block}
                onDrop={block}
                onDragOver={(e) => e.preventDefault()}
                onContextMenu={block}
                disabled={!canType}
                rows={2}
                aria-label="Your answer"
                placeholder={canType ? "Type your answer here. Explain your reasoning like you would to a colleague." : busy ? "Waiting for the interviewer…" : "Answering is paused"}
                className="scroll-thin block max-h-48 min-h-[4.25rem] w-full resize-none sm:min-h-[5.5rem] bg-transparent px-3 py-2 text-[15px] leading-relaxed text-mist-100 placeholder:text-mist-600 focus:outline-none disabled:opacity-50 sm:text-base"
              />
              <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-1">
                <div className="min-w-0 text-[11px] text-mist-500">
                  {notice ? <span className="text-warn">{notice}</span> : <span className="tabular-nums">{draft.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}</span>}
                  <span className="ml-3 hidden sm:inline">Ctrl/⌘ + Enter to send</span>
                </div>
                <button type="button" onClick={submit} disabled={!canType || !draft.trim()} className="btn-primary !px-5 !py-2.5">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <SendHorizontal className="h-4 w-4" aria-hidden="true" />}
                  Send
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ---------------- devices lost / not started: hard stop ---------------- */}
      <AnimatePresence>
        {devicesBlocked && (
          <motion.div
            key="blocked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-5 backdrop-blur-md"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="blocked-title"
          >
            <div className="glass-strong w-full max-w-md rounded-[2rem] p-7 text-center">
              <span className="glass-flat mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
                {mediaStatus === "requesting" ? <Loader2 className="h-6 w-6 animate-spin text-violet-300" /> : <Camera className="h-6 w-6 text-warn" />}
              </span>
              <h2 id="blocked-title" className="mt-5 font-display text-xl font-bold text-mist-100">
                {mediaStatus === "lost" ? "Camera or microphone disconnected" : "Camera and microphone required"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-mist-400">
                {mediaMessage || "The interview is paused. Turn your camera and microphone on to continue from where you stopped."}
              </p>
              <button type="button" onClick={enable} disabled={mediaStatus === "requesting"} className="btn-primary mt-6 w-full">
                {mediaStatus === "requesting" ? "Waiting for permission…" : "Turn camera and microphone on"}
              </button>
              <button type="button" onClick={() => setEndOpen(true)} disabled={messages.length === 0} className="mt-3 text-xs text-mist-500 underline underline-offset-4 hover:text-mist-200 disabled:hidden">
                End interview instead
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={leaveOpen}
        title="Leave the interview?"
        description="Your progress will be lost and no report will be generated."
        confirmLabel="Leave"
        cancelLabel="Stay"
        danger
        onCancel={() => setLeaveOpen(false)}
        onConfirm={() => {
          setLeaveOpen(false);
          onHome();
        }}
      />
      <ConfirmModal
        open={endOpen}
        title="End the interview now?"
        description={`You have answered ${Math.max(0, questionNumber - 1)} question${questionNumber - 1 === 1 ? "" : "s"}. A report will be created from those answers only, and marked as low confidence because the full interview has ${MIN_QUESTIONS} questions.`}
        confirmLabel="End and view report"
        cancelLabel="Keep going"
        danger
        onCancel={() => setEndOpen(false)}
        onConfirm={confirmEnd}
      />
    </div>
  );
}
