"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { companions, type Companion } from "@/data/companions";
import { sessions } from "@/data/sessions";
import { UnlockImage } from "@/components/photo/UnlockImage";
import { IconButton } from "@/components/ui/Button";
import { TopBar } from "@/components/ui/Frame";
import { ICON } from "@/lib/icons";
import { useSession } from "@/lib/session";

function PeopleList({ title, people, empty }: { title: string; people: Companion[]; empty: string }) {
  return (
    <section className="px-5 pt-6">
      <h2 className="text-caption text-ink-2">{title}</h2>
      {people.length === 0 ? (
        <p className="mt-2 rounded-card bg-surface px-5 py-3.5 text-body text-ink-2 ring-[1.5px] ring-line">{empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line border-y-[1.5px] border-line">
          {people.map((c) => (
            <li key={c.id}>
              <Link href={`/companions/${c.id}`} className="flex min-h-20 items-center gap-3 py-3 transition-transform active:scale-[0.98]">
                <UnlockImage companion={c} className="size-14 shrink-0 rounded-full" />
                <span className="min-w-0 flex-1">
                  <span className="block text-body text-ink">{c.name}</span>
                  <span className="block truncate text-body text-ink-2">{c.role}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** People the member saved or has already met. Everyone else lives on Home. */
export function YourPeople() {
  const { savedIds } = useSession();
  const pastIds = new Set(sessions.filter((s) => s.status === "completed").map((s) => s.companionId));

  return (
    <main className="pb-8">
      <TopBar>
        <IconButton label="Back to profile" href="/profile">
          <ArrowLeft size={ICON.md} />
        </IconButton>
      </TopBar>
      <h1 className="px-5 pt-4 font-serif text-headline text-ink">Saved and past</h1>
      <PeopleList
        title="Saved"
        people={companions.filter((c) => savedIds.includes(c.id))}
        empty="No one saved yet. Open a profile and tap the bookmark."
      />
      <PeopleList
        title="Met before"
        people={companions.filter((c) => pastIds.has(c.id))}
        empty="Companions you've met will show here."
      />
    </main>
  );
}
