import { ShieldCheck, ShieldAlert, Loader2, UserX, Users } from "lucide-react";

const MAP = {
  loading: { icon: Loader2, text: "Checking presence", tone: "text-mist-300", spin: true },
  ok: { icon: ShieldCheck, text: "Presence verified", tone: "text-success" },
  missing: { icon: UserX, text: "Candidate not found", tone: "text-danger" },
  multiple: { icon: Users, text: "Multiple people", tone: "text-warn" },
  unavailable: { icon: ShieldAlert, text: "Monitoring unavailable", tone: "text-warn" },
};

export default function PresenceBadge({ status, compact = false }) {
  const m = MAP[status] || MAP.loading;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${m.tone}`} role="status">
      <Icon className={`h-3.5 w-3.5 ${m.spin ? "animate-spin" : ""}`} aria-hidden="true" />
      {!compact && m.text}
      {compact && <span className="sr-only">{m.text}</span>}
    </span>
  );
}
