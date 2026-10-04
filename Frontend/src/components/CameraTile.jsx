import { forwardRef, useEffect } from "react";

/**
 * <video> bound to the live local stream. Mirrored like a selfie view.
 * The forwarded ref lets the face monitor read frames from it.
 */
const CameraTile = forwardRef(function CameraTile({ stream, className = "", children }, ref) {
  useEffect(() => {
    const el = ref && "current" in ref ? ref.current : null;
    if (el && el.srcObject !== (stream || null)) {
      el.srcObject = stream || null;
      if (stream) el.play?.().catch(() => {});
    }
  }, [stream, ref]);

  return (
    <div className={`relative overflow-hidden bg-black/50 ${className}`}>
      <video
        ref={ref}
        autoPlay
        playsInline
        muted
        aria-label="Your camera preview"
        className="h-full w-full -scale-x-100 object-cover"
      />
      {children}
    </div>
  );
});

export default CameraTile;
