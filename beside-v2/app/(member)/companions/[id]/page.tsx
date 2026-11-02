import { notFound } from "next/navigation";
import { Buildings, MapPin, SealCheck, ShieldCheck, Star, Translate } from "@phosphor-icons/react/ssr";
import { companions, getCompanion, RATING_MIN_SESSIONS } from "@/data/companions";
import { Pill } from "@/components/ui/Badge";
import { ProfileHero } from "@/components/member/ProfileHero";
import { ProfileActions } from "@/components/member/ProfileActions";
import { VoiceHello } from "@/components/browse/VoiceHello";
import { ICON } from "@/lib/icons";

/** Member screens are gated on the client by MemberGuard, so skip instant-navigation validation. */
export const instant = false;

export function generateStaticParams() {
  return companions.map((c) => ({ id: c.id }));
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function CompanionProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCompanion(id);
  if (!c) notFound();

  return (
    <main className="pb-[calc(96px+env(safe-area-inset-bottom))]">
      <ProfileHero companion={c} />

      {/* White sheet rising over the lower third of the photo. */}
      <div className="relative -mt-[min(41.6vw,162px)] rounded-t-[28px] bg-canvas px-5 pt-3">
        <div aria-hidden className="mx-auto h-1.5 w-10 rounded-full bg-line" />

        <section className="pt-4">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-headline text-ink">{c.name}</h1>
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-pink-tint px-2.5 text-caption text-ink">
              <SealCheck size={ICON.sm} weight="fill" aria-hidden /> Verified
            </span>
          </div>
          <p className="mt-1 text-ink-2">{c.role}</p>
          {c.rating !== null && c.sessions >= RATING_MIN_SESSIONS ? (
            <p className="mt-1 flex items-center gap-1 text-caption text-ink-2">
              <Star size={ICON.sm} weight="fill" className="text-ink" aria-hidden />
              <span className=" text-ink">{c.rating}</span> · {c.sessions} sessions
            </p>
          ) : null}
        </section>

        <section className="pt-5">
          <VoiceHello name={c.name} seconds={c.voiceNote.durationSec} url={c.voiceNote.url} transcript={c.voiceNote.transcript} />
        </section>

        <section className="pt-5">
          <h2 className="sr-only">Ask me about</h2>
          <ul className="space-y-3">
            {c.prompts.slice(0, 3).map((p) => (
              <li key={p} className="rounded-card bg-surface px-5 py-3.5 ring-[1.5px] ring-line">
                <p className="text-body text-ink">{p}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="pt-6">
          <h2 className="text-section text-ink">Good for</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {c.goodFor.map((g) => (
              <li key={g}>
                <Pill>{g}</Pill>
              </li>
            ))}
          </ul>
        </section>

        <section className="pt-6">
          <dl className="divide-y divide-line border-y-[1.5px] border-line">
            <div className="flex items-start gap-3 py-3">
              <Translate size={ICON.md} className="mt-0.5 shrink-0 text-ink" aria-hidden />
              <dt className="sr-only">Languages</dt>
              <dd className="text-body text-ink">{c.languages.join(", ")}</dd>
            </div>
            <div className="flex items-start gap-3 py-3">
              <MapPin size={ICON.md} className="mt-0.5 shrink-0 text-ink" aria-hidden />
              <dt className="sr-only">Neighbourhoods</dt>
              <dd className="text-body text-ink">{c.neighbourhoods.join(", ")}</dd>
            </div>
          </dl>
        </section>

        <section className="pt-6">
          <div className="rounded-card bg-pink-tint p-4">
            <h2 className=" text-ink">How safety works</h2>
            <ul className="mt-2 space-y-2 text-body text-ink">
              <li className="flex gap-2">
                <SealCheck size={ICON.md} className="mt-px shrink-0 text-ink" aria-hidden /> ID-verified, both of you
              </li>
              <li className="flex gap-2">
                <Buildings size={ICON.md} className="mt-px shrink-0 text-ink" aria-hidden /> Public partner venues only
              </li>
              <li className="flex gap-2">
                <ShieldCheck size={ICON.md} className="mt-px shrink-0 text-ink" aria-hidden /> Safety team on call during every session
              </li>
            </ul>
          </div>
        </section>

        <section className="pb-4 pt-6">
          <h2 className="text-section text-ink">Availability</h2>
          <ol className="mt-3 grid grid-cols-7 gap-1 text-center">
            {DAYS.map((d, i) => (
              <li key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-caption text-ink-2" aria-hidden>
                  {d}
                </span>
                <span
                  role="img"
                  aria-label={`${DAY_NAMES[i]}: ${c.availability[i] ? "open" : "not available"}`}
                  className={`size-2 rounded-full ${c.availability[i] ? "bg-pink" : "bg-line"}`}
                />
              </li>
            ))}
          </ol>
        </section>
      </div>

      <ProfileActions companionId={c.id} />
    </main>
  );
}
