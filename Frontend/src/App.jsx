import { useCallback, useEffect, useState } from "react";
import Background from "./components/Background";
import ErrorBoundary from "./components/ErrorBoundary";
import Landing from "./pages/Landing";
import CandidateSetup from "./pages/CandidateSetup";
import DeviceCheck from "./pages/DeviceCheck";
import Interview from "./pages/Interview";
import Results from "./pages/Results";
import { createSessionId } from "./services/interviewApi";
import { useMediaDevices } from "./hooks/useMediaDevices";

const STORAGE_KEY = "novix.interview.session";
const DRAFT_KEY = "novix.setup.draft";
const PHASES = ["landing", "setup", "devices", "interview", "results"];

function loadPersisted() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (!data || !PHASES.includes(data.phase)) return null;
    // A phase is only valid if the data it needs is present.
    if ((data.phase === "devices" || data.phase === "interview") && (!data.candidate || !data.sessionId)) return null;
    if (data.phase === "results" && !data.result) return null;
    return data;
  } catch {
    return null;
  }
}

function savePersisted(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable (private mode / quota) — not fatal */
  }
}

export default function App() {
  const [initial] = useState(loadPersisted);

  const [phase, setPhase] = useState(initial?.phase || "landing");
  const [candidate, setCandidate] = useState(initial?.candidate || null);
  const [sessionId, setSessionId] = useState(initial?.sessionId || null);
  const [interviewState, setInterviewState] = useState(initial?.interviewState || null);
  const [result, setResult] = useState(initial?.result || null);

  // The camera + microphone live here so they survive page changes and
  // can always be shut off from a single place.
  const media = useMediaDevices();
  const { disable: disableMedia } = media;

  useEffect(() => {
    savePersisted({ phase, candidate, sessionId, interviewState, result });
  }, [phase, candidate, sessionId, interviewState, result]);

  // Release the devices whenever the interview flow is left.
  useEffect(() => {
    if (phase === "landing" || phase === "setup" || phase === "results") disableMedia();
  }, [phase, disableMedia]);

  const go = (next) => {
    setPhase(next);
    window.scrollTo({ top: 0 });
  };

  const handleCandidateReady = (payload) => {
    setCandidate(payload);
    setSessionId(createSessionId());
    setInterviewState(null);
    setResult(null);
    go("devices");
  };

  const handleComplete = ({ closingMessage, feedback }) => {
    setResult({ closingMessage, feedback });
    setInterviewState(null);
    go("results");
  };

  const handleRestart = () => {
    setCandidate(null);
    setSessionId(null);
    setInterviewState(null);
    setResult(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    disableMedia();
    go("landing");
  };

  const persistInterview = useCallback((state) => setInterviewState(state), []);

  return (
    <ErrorBoundary>
      <Background />
      <div className="relative min-h-dvh">
        {phase === "landing" && <Landing onStart={() => go("setup")} />}

        {phase === "setup" && <CandidateSetup onBack={() => go("landing")} onReady={handleCandidateReady} />}

        {phase === "devices" && candidate && (
          <DeviceCheck candidateName={candidate.member?.name} media={media} onBack={() => go("setup")} onStart={() => go("interview")} />
        )}

        {phase === "interview" && candidate && sessionId && (
          <Interview
            candidate={candidate}
            sessionId={sessionId}
            persisted={interviewState}
            onPersist={persistInterview}
            onComplete={handleComplete}
            onHome={handleRestart}
            media={media}
          />
        )}

        {phase === "results" && (
          <Results closingMessage={result?.closingMessage} feedback={result?.feedback} candidateName={candidate?.member?.name} onRestart={handleRestart} />
        )}
      </div>
    </ErrorBoundary>
  );
}
