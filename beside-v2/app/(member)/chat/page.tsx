import Link from "next/link";
import { ArrowLeft, CaretRight } from "@phosphor-icons/react/ssr";
import { IconButton } from "@/components/ui/Button";
import { TopBar } from "@/components/ui/Frame";
import { getCompanion } from "@/data/companions";
import { sessions } from "@/data/sessions";
import { UnlockImage } from "@/components/photo/UnlockImage";
import { NAV_CLEARANCE } from "@/lib/layout";
import { RelativeDay } from "@/lib/dates";
import { ICON } from "@/lib/icons";

/** Member screens are gated on the client by MemberGuard, so skip instant-navigation validation. */
export const instant = false;

export default function MessagesPage() {
  return (
    <main style={{ paddingBottom: `calc(${NAV_CLEARANCE + 24}px + env(safe-area-inset-bottom))` }}>
      <TopBar>
        <IconButton label="Back to profile" href="/profile">
          <ArrowLeft size={ICON.md} />
        </IconButton>
      </TopBar>
      <h1 className="px-5 pt-4 font-serif text-headline text-ink">Messages</h1>
      {sessions.length === 0 ? (
        <p className="mx-4 mt-6 rounded-card bg-surface px-5 py-3.5 text-body text-ink-2 ring-[1.5px] ring-line">
          No messages yet. A chat opens once a companion accepts your request.
        </p>
      ) : (
        <ul aria-label="Conversations" className="mt-4 divide-y divide-line border-y-[1.5px] border-line px-5">
          {sessions.map((s) => {
            const c = getCompanion(s.companionId);
            if (!c) return null;
            return (
              <li key={s.id}>
                <Link href={`/chat/${s.id}`} className="flex min-h-20 items-center gap-3 py-3 transition-transform active:scale-[0.98]">
                  <UnlockImage companion={c} className="size-12 shrink-0 rounded-full" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-ink">{c.name}</span>
                    <span className="block truncate text-caption text-ink-2">
                      <RelativeDay offset={s.dayOffset} /> · {s.venue.name}
                    </span>
                    <span className="block text-caption text-ink-2">{s.chat === "open" ? "Chat open" : "Chat closed"}</span>
                  </span>
                  <CaretRight size={ICON.md} className="text-ink-2" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
