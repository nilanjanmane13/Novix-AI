import { useEffect, useState } from "react";

/**
 * Live microphone loudness (0..1) for the level meter.
 * Audio is analysed in memory only; it is never recorded or sent anywhere.
 * `heard` turns true once real sound has been picked up at least once.
 */
export function useMicLevel(stream) {
  const [level, setLevel] = useState(0);
  const [heard, setHeard] = useState(false);

  useEffect(() => {
    const audioTracks = stream ? stream.getAudioTracks() : [];
    if (!audioTracks.length) {
      setLevel(0);
      return undefined;
    }

    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return undefined;

    let ctx;
    let source;
    let raf = 0;
    let cancelled = false;

    try {
      ctx = new Ctx();
      source = ctx.createMediaStreamSource(new MediaStream(audioTracks));
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.fftSize);

      let smoothed = 0;
      let lastPaint = 0;

      const loop = (t) => {
        if (cancelled) return;
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        smoothed = smoothed * 0.7 + Math.min(1, rms * 5) * 0.3;

        if (t - lastPaint > 70) {
          lastPaint = t;
          setLevel(smoothed);
          if (smoothed > 0.08) setHeard(true);
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
    } catch {
      // Level meter is cosmetic; the microphone itself is still verified by the stream.
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      try {
        source?.disconnect();
        ctx?.close();
      } catch {
        /* ignore */
      }
      setLevel(0);
    };
  }, [stream]);

  return { level, heard };
}
