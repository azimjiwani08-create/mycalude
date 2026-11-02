import Link from "next/link";
import { CalendarBlank, Clock, MapPin, ShieldCheck } from "@phosphor-icons/react/ssr";
import type { Session } from "@/data/sessions";
import { StatusPill } from "@/components/ui/Badge";
import { useDayLabel } from "@/lib/dates";
import { ICON } from "@/lib/icons";

/** Double-bezel session summary pinned at the top of the thread. */
export function SessionCard({ session, showLiveLink }: { session: Session; showLiveLink?: boolean }) {
  const dayLabel = useDayLabel();
  const rows = [
    { icon: CalendarBlank, text: dayLabel(session.dayOffset) },
    { icon: Clock, text: `${session.time} to ${session.endTime} · ${session.duration}` },
    { icon: MapPin, text: `${session.venue.name}, ${session.venue.area}` },
  ];
  return (
    <div className="rounded-card bg-surface p-1.5 ring-[1.5px] ring-line">
      <div className="rounded-inner bg-canvas px-5 py-3.5">
        <div className="flex items-center justify-between">
          <p className="text-caption uppercase tracking-wide text-ink-2">Your session</p>
          {session.status === "confirmed" ? (
            <StatusPill>Confirmed</StatusPill>
          ) : (
            <StatusPill tone="neutral">Completed</StatusPill>
          )}
        </div>
        <ul className="mt-3 space-y-2">
          {rows.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2.5 text-body text-ink">
              <Icon size={ICON.md} className="shrink-0 text-ink" aria-hidden />
              {text}
            </li>
          ))}
        </ul>
        {showLiveLink ? (
          <Link
            href={`/session/${session.id}`}
            className="-mx-2 mt-2 flex h-11 items-center gap-2 rounded-btn px-2 text-body text-ink hover:bg-pink-tint"
          >
            <ShieldCheck size={ICON.md} aria-hidden />
            Open live session and safety
          </Link>
        ) : null}
      </div>
    </div>
  );
}
