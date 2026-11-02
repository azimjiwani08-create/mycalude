import { ShieldCheck } from "@phosphor-icons/react/ssr";
import { ICON } from "@/lib/icons";

export function SafetyStrip() {
  return (
    <p className="flex items-center gap-2 bg-pink-tint px-5 py-2 text-caption text-ink-2">
      <ShieldCheck size={ICON.sm} className="shrink-0 text-ink" aria-hidden />
      Keep chat on Beside. Don&apos;t share numbers or move the plan.
    </p>
  );
}
