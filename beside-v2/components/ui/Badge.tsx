import type { ReactNode } from "react";
import { Check } from "@phosphor-icons/react/ssr";
import { ICON } from "@/lib/icons";

export function VerifiedBadge({ label = "Verified" }: { label?: string }) {
  return (
    <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-pink-tint pl-1.5 pr-2.5 text-caption text-ink">
      <Check size={ICON.sm} aria-hidden />
      {label}
    </span>
  );
}

/** Neutral, non-interactive pill for facts like languages. */
export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center rounded-full border-[1.5px] border-line bg-surface px-3 text-caption text-ink-2">
      {children}
    </span>
  );
}

/** Status pill, e.g. "Confirmed" on a session card. */
export function StatusPill({ children, tone = "action" }: { children: ReactNode; tone?: "action" | "neutral" }) {
  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-caption ${
        tone === "action" ? "bg-pink-tint text-ink" : "bg-hover text-ink-2"
      }`}
    >
      {tone === "action" ? <Check size={ICON.sm} aria-hidden /> : null}
      {children}
    </span>
  );
}
