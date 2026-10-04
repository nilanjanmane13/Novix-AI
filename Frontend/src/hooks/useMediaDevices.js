import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Camera + microphone, requested together because BOTH are mandatory.
 *
 * Status values
 *   idle        not requested yet
 *   requesting  permission prompt open
 *   ready       camera and microphone are live
 *   denied      user (or browser policy) blocked access
 *   unavailable no device found / device busy / not supported
 *   insecure    page is not served over HTTPS
 *   lost        a track ended after it had been live (unplugged, revoked)
 *
 * Privacy: media is only shown locally in <video> and analysed on-device.
 * Nothing is recorded, stored or uploaded.
 */
export function useMediaDevices() {
  const [status, setStatus] = useState("idle");
  const [stream, setStream] = useState(null);
  const [message, setMessage] = useState("");

  const streamRef = useRef(null);
  const interruptionsRef = useRef(0);

  const stopTracks = useCallback(() => {
    const current = streamRef.current;
    streamRef.current = null; // clear first so "ended" handlers know this was intentional
    if (current) current.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, []);

  const enable = useCallback(async () => {
    const md = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;

    if (!md || !md.getUserMedia) {
      const insecure = typeof window !== "undefined" && window.isSecureContext === false;
      setStatus(insecure ? "insecure" : "unavailable");
      setMessage(
        insecure
          ? "Camera access needs a secure connection (HTTPS). Open the site using its https:// address."
          : "This browser does not support camera access. Please use a recent version of Chrome, Edge, Safari or Firefox."
      );
      return false;
    }

    stopTracks();
    setStatus("requesting");
    setMessage("");

    const attempt = async (constraints) => md.getUserMedia(constraints);

    try {
      let media;
      try {
        media = await attempt({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      } catch (err) {
        if (err && err.name === "OverconstrainedError") media = await attempt({ video: true, audio: true });
        else throw err;
      }

      const hasVideo = media.getVideoTracks().some((t) => t.readyState === "live");
      const hasAudio = media.getAudioTracks().some((t) => t.readyState === "live");
      if (!hasVideo || !hasAudio) {
        media.getTracks().forEach((t) => t.stop());
        setStatus("unavailable");
        setMessage("Both a camera and a microphone are required, but one of them could not be started.");
        return false;
      }

      streamRef.current = media;
      media.getTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          if (streamRef.current !== media) return; // we stopped it ourselves
          interruptionsRef.current += 1;
          stopTracks();
          setStatus("lost");
          setMessage("Your camera or microphone was disconnected or turned off.");
        });
      });

      setStream(media);
      setStatus("ready");
      return true;
    } catch (err) {
      stopTracks();
      const name = err && err.name;
      if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
        setStatus("denied");
        setMessage(
          "Access was blocked. Click the camera icon in your browser's address bar, allow camera and microphone for this site, then try again."
        );
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setStatus("unavailable");
        setMessage("No camera or microphone was found. Connect both devices and try again.");
      } else if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError") {
        setStatus("unavailable");
        setMessage("Your camera or microphone is being used by another application. Close it and try again.");
      } else {
        setStatus("unavailable");
        setMessage("The camera and microphone could not be started. Check your devices and try again.");
      }
      return false;
    }
  }, [stopTracks]);

  const disable = useCallback(() => {
    stopTracks();
    setStatus("idle");
    setMessage("");
  }, [stopTracks]);

  const getInterruptions = useCallback(() => interruptionsRef.current, []);

  // Always release the devices when the app unmounts.
  useEffect(() => () => stopTracks(), [stopTracks]);

  return { status, stream, message, enable, disable, getInterruptions, isReady: status === "ready" };
}
