import AIOrb from "./AIOrb";

/** One message in the interview conversation. role: "ai" | "user". */
export default function ChatBubble({ role, text, index }) {
  if (role === "ai") {
    return (
      <div className="flex items-start gap-3 sm:gap-4">
        <AIOrb size="sm" className="mt-1" />
        <div className="min-w-0 max-w-[88%] sm:max-w-[80%]">
          <p className="mb-1.5 text-[11px] font-medium text-violet-300">
            Novix AI{typeof index === "number" ? ` · Question ${index}` : ""}
          </p>
          <div className="glass rounded-3xl rounded-tl-md px-4 py-3.5 sm:px-5 sm:py-4">
            <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-mist-100 sm:text-base">{text}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[88%] sm:max-w-[78%]">
        <p className="mb-1.5 text-right text-[11px] font-medium text-mist-500">You</p>
        <div
          className="rounded-3xl rounded-tr-md px-4 py-3.5 sm:px-5 sm:py-4"
          style={{
            background: "linear-gradient(160deg, rgba(150,118,255,0.55), rgba(96,56,226,0.5))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 0 0 1px rgba(183,161,255,0.3), 0 12px 30px -14px rgba(124,92,252,0.8)",
          }}
        >
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-white sm:text-base">{text}</p>
        </div>
      </div>
    </div>
  );
}
