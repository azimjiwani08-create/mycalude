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

export default function SessionsPage() {
  const groups = [
    ["Upcoming", sessions.filter((s) => s.status === "confirmed")],
    ["Past", sessions.filter((s) => s.status === "completed")],
  ] as const;

  return (
    <main style={{ paddingBottom: `calc(${NAV_CLEARANCE + 24}px + env(safe-area-inset-bottom))` }}>
      <TopBar>
        <IconButton label="Back to profile" href="/profile">
          <ArrowLeft size={ICON.md} />
        </IconButton>
      </TopBar>
      <h1 className="px-5 pt-4 font-serif text-headline text-ink">Sessions</h1>
      {groups.map(([title, list]) => (
        <section key={title} className="px-5 pt-6">
          <h2 className="text-caption text-ink-2">{title}</h2>
          <ul className="mt-2 divide-y divide-line border-y-[1.5px] border-line">
            {list.map((s) => {
              const c = getCompanion(s.companionId);
              if (!c) return null;
              return (
                <li key={s.id}>
                  <Link href={`/chat/${s.id}`} className="flex min-h-20 items-center gap-3 py-3 transition-transform active:scale-[0.98]">
                    <UnlockImage companion={c} className="size-12 shrink-0 rounded-full" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-ink">{c.name}</span>
                      <span className="block truncate text-caption text-ink-2">
                        <RelativeDay offset={s.dayOffset} /> · {s.time} · {s.venue.name}
                      </span>
                    </span>
                    <CaretRight size={ICON.md} className="text-ink-2" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </main>
  );
}
