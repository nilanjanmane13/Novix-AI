import { useCallback, useEffect, useRef, useState } from "react";

/**
 * On-device face presence monitoring.
 *
 * Uses the TinyFaceDetector model from face-api (a small neural network,
 * ~190 KB) that is bundled with this site under /models, so nothing is
 * downloaded from third parties and no video leaves the device.
 *
 * Status
 *   loading      model loading / waiting for first frames
 *   ok           exactly one face in view
 *   missing      no face for ~3 seconds  -> "Candidate not found" warning
 *   multiple     more than one face for ~2 seconds
 *   unavailable  the model could not run (monitoring is skipped, never fatal)
 *
 * Debouncing avoids false alarms from blinks, quick head turns or a single
 * bad frame.
 */

const SAMPLE_MS = 600;
const MISSING_AFTER = 5; // consecutive empty samples (~3 s)
const MULTIPLE_AFTER = 3; // consecutive multi-face samples (~1.8 s)
const OK_AFTER = 2;

let faceApiPromise = null;

function loadFaceApi() {
  if (!faceApiPromise) {
    faceApiPromise = (async () => {
      const faceapi = await import("@vladmandic/face-api");
      await faceapi.tf.ready();
      await faceapi.nets.tinyFaceDetector.loadFromUri(`${import.meta.env.BASE_URL}models`);
      return faceapi;
    })().catch((err) => {
      faceApiPromise = null; // allow a retry later
      throw err;
    });
  }
  return faceApiPromise;
}

export function useFaceMonitor({ videoRef, enabled }) {
  const [status, setStatus] = useState("loading");
  const [box, setBox] = useState(null);

  const stats = useRef({
    faceMissingEvents: 0,
    faceMissingSeconds: 0,
    multipleFaceEvents: 0,
    monitoringAvailable: true,
  });

  useEffect(() => {
    if (!enabled) {
      setStatus("loading");
      setBox(null);
      return undefined;
    }

    let cancelled = false;
    let timer = null;
    let noFace = 0;
    let oneFace = 0;
    let manyFaces = 0;
    let errors = 0;
    let current = "loading";
    let lastTick = Date.now();

    const set = (next) => {
      if (current !== next) {
        current = next;
        setStatus(next);
      }
    };

    (async () => {
      let faceapi;
      try {
        faceapi = await loadFaceApi();
      } catch (err) {
        console.warn("[Novix] Face monitoring unavailable:", err);
        stats.current.monitoringAvailable = false;
        if (!cancelled) set("unavailable");
        return;
      }
      if (cancelled) return;

      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.45 });

      const tick = async () => {
        if (cancelled) return;
        const now = Date.now();
        const dt = (now - lastTick) / 1000;
        lastTick = now;

        const video = videoRef.current;
        const ready = video && video.readyState >= 2 && video.videoWidth > 0 && !document.hidden;

        if (!ready) {
          timer = setTimeout(tick, SAMPLE_MS);
          return;
        }

        try {
          const detections = await faceapi.detectAllFaces(video, options);
          if (cancelled) return;
          errors = 0;
          const count = detections.length;

          if (count === 0) {
            noFace += 1;
            oneFace = 0;
            manyFaces = 0;
            setBox(null);
            if (noFace === MISSING_AFTER) {
              stats.current.faceMissingEvents += 1;
              stats.current.faceMissingSeconds += Math.round(MISSING_AFTER * (SAMPLE_MS / 1000));
              set("missing");
            } else if (noFace > MISSING_AFTER) {
              stats.current.faceMissingSeconds += dt;
            }
          } else if (count === 1) {
            oneFace += 1;
            noFace = 0;
            manyFaces = 0;
            const b = detections[0].box;
            setBox({
              x: b.x / video.videoWidth,
              y: b.y / video.videoHeight,
              w: b.width / video.videoWidth,
              h: b.height / video.videoHeight,
            });
            if (oneFace >= OK_AFTER) set("ok");
          } else {
            manyFaces += 1;
            noFace = 0;
            oneFace = 0;
            setBox(null);
            if (manyFaces === MULTIPLE_AFTER) {
              stats.current.multipleFaceEvents += 1;
              set("multiple");
            }
          }
        } catch (err) {
          errors += 1;
          if (errors >= 6) {
            console.warn("[Novix] Face monitoring stopped after repeated errors:", err);
            stats.current.monitoringAvailable = false;
            set("unavailable");
            return;
          }
        }

        timer = setTimeout(tick, SAMPLE_MS);
      };

      tick();
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, videoRef]);

  /** Integrity numbers for the backend (rounded, safe to call any time). */
  const getSummary = useCallback(
    () => ({
      faceMissingEvents: stats.current.faceMissingEvents,
      faceMissingSeconds: Math.round(stats.current.faceMissingSeconds),
      multipleFaceEvents: stats.current.multipleFaceEvents,
      monitoringAvailable: stats.current.monitoringAvailable,
    }),
    []
  );

  return { status, box, getSummary };
}
