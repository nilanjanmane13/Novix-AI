import { useEffect, useState } from "react";
import { formatDuration } from "../utils/format";

/** Elapsed-time clock (not a countdown, to avoid exam-style pressure). */
export default function Timer({ startedAt, className = "" }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (!startedAt) return null;

  return (
    <span className={`font-mono text-xs tabular-nums text-mist-300 ${className}`} aria-label="Elapsed time">
      {formatDuration((now - startedAt) / 1000)}
    </span>
  );
}
