"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarBlank, Check, Clock, Hourglass, MapPin, WarningCircle } from "@phosphor-icons/react/ssr";
import { getCompanion, sessionFee, SESSION_LENGTHS, type Venue } from "@/data/companions";
import { Button, IconButton } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { BottomBar, TopBar } from "@/components/ui/Frame";
import { useDayLabel } from "@/lib/dates";
import { useSession } from "@/lib/session";
import { containsContact, rupees } from "@/lib/format";
import { ICON } from "@/lib/icons";

const DAY_OFFSETS = [1, 2, 3, 4, 5];
const TIMES = ["11:00 am", "1:00 pm", "4:00 pm", "6:00 pm"];

export function PlanFlow() {
  const router = useRouter();
  const { planCompanionId } = useSession();
  const companion = getCompanion(planCompanionId ?? "meera") ?? getCompanion("meera")!;

  const [day, setDay] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [minutes, setMinutes] = useState<number>(SESSION_LENGTHS[0]);
  const [topic, setTopic] = useState<string | null>(null);
  const dayLabel = useDayLabel();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // Prototype: the companion "accepts" a few seconds after the request is sent.
  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => setAccepted(true), 3000);
    return () => clearTimeout(t);
  }, [sent]);

  const noteBlocked = containsContact(note);
  const missing = [!topic && "a topic", !day && "a day", !time && "a time", !venue && "a venue"].filter(Boolean) as string[];
  const reason = noteBlocked
    ? "Remove the number or link from your note to continue."
    : missing.length
      ? `Choose ${missing.join(", ").replace(/, ([^,]*)$/, " and $1")} to send your request.`
      : undefined;

  if (sent && venue && day && time) {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <div className="px-5 pt-16">
          <span className="flex size-12 items-center justify-center rounded-full bg-pink-tint text-ink">
            {accepted ? <Check size={ICON.lg} aria-hidden /> : <Hourglass size={ICON.lg} aria-hidden />}
          </span>
          <div aria-live="polite">
            <h1 className="mt-6 font-serif text-headline text-ink">
              {accepted ? `${companion.name} accepted your request` : `Request sent to ${companion.name}`}
            </h1>
            <p className="mt-2 text-ink-2">
              {accepted
                ? "Your chat is open. Keep everything on Beside, including any changes to the plan."
                : `${companion.replyTime}. Your chat opens once she accepts. Nothing is charged until then.`}
            </p>
          </div>

          <dl className="mt-8 divide-y divide-line rounded-card bg-surface px-5 ring-[1.5px] ring-line">
            {[
              [CalendarBlank, "Day", day],
              [Clock, "Time", `${time} · ${minutes} min`],
              [MapPin, "Venue", `${venue.name}, ${venue.area}`],
            ].map(([Icon, label, value]) => {
              const I = Icon as typeof MapPin;
              return (
                <div key={label as string} className="flex items-center gap-3 py-3.5">
                  <I size={ICON.md} className="shrink-0 text-ink" aria-hidden />
                  <dt className="w-16 text-caption text-ink-2">{label as string}</dt>
                  <dd className=" text-ink">{value as string}</dd>
                </div>
              );
            })}
          </dl>
        </div>
        <BottomBar>
          <div className="space-y-1">
            <Button
              disabled={!accepted}
              reason={`Chat opens once ${companion.name} accepts.`}
              onClick={() => router.push("/chat/s1")}
            >
              Open chat
            </Button>
            <Button variant="ghost" href="/">
              Back to companions
            </Button>
          </div>
        </BottomBar>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <TopBar>
        <IconButton label="Back to profile" href={`/companions/${companion.id}`}>
          <ArrowLeft size={ICON.md} />
        </IconButton>
        <div className="min-w-0">
          <p className="truncate text-ink">Plan with {companion.name}</p>
          <p className="truncate text-caption text-ink-2">{companion.role}</p>
        </div>
      </TopBar>

      <div className="space-y-8 px-5 pb-8 pt-6">
        <fieldset className="min-w-0">
          <legend className="text-section text-ink">What would you like to work on?</legend>
          <div className="mt-3 flex flex-wrap gap-2 py-1">
            {companion.goodFor.map((g) => (
              <Chip key={g} selected={topic === g} onClick={() => setTopic(g)}>
                {g}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="text-section text-ink">Which day?</legend>
          <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 py-1">
            {DAY_OFFSETS.map((offset) => {
              const d = dayLabel(offset);
              return (
                <Chip key={offset} selected={day === d} onClick={() => setDay(d)}>
                  {d}
                </Chip>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="text-section text-ink">What time?</legend>
          <div className="mt-3 flex flex-wrap gap-2 py-1">
            {TIMES.map((t) => (
              <Chip key={t} selected={time === t} onClick={() => setTime(t)}>
                {t}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="text-section text-ink">How long?</legend>
          <div className="mt-3 flex flex-wrap gap-2 py-1">
            {SESSION_LENGTHS.map((m) => (
              <Chip key={m} selected={minutes === m} onClick={() => setMinutes(m)}>
                {m} min
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="text-section text-ink">Where?</legend>
          <p className="mt-1 text-caption text-ink-2">Public venues {companion.name} has approved.</p>
          <div className="mt-3 space-y-2">
            {companion.venues.map((v) => {
              const selected = venue?.name === v.name;
              return (
                <label
                  key={v.name}
                  className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-inner border px-5 py-3 transition-colors ${
                    selected ? "border-ink bg-pink-tint" : "border-line bg-surface hover:bg-hover"
                  }`}
                >
                  <input
                    type="radio"
                    name="venue"
                    checked={selected}
                    onChange={() => setVenue(v)}
                    className="size-5 shrink-0 accent-pink"
                  />
                  <span>
                    <span className="block text-ink">{v.name}</span>
                    <span className="block text-caption text-ink-2">
                      {v.kind} · {v.area}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="plan-note" className="text-section text-ink">
            Anything she should know?
          </label>
          <p className="mt-1 text-caption text-ink-2">Optional. A line or two helps her prepare.</p>
          <textarea
            id="plan-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="For example: small talk before a work event"
            aria-describedby={noteBlocked ? "plan-note-guard" : undefined}
            className={`mt-3 block w-full resize-none rounded-inner border bg-surface px-5 py-3 text-body text-ink ${
              noteBlocked ? "border-alert" : "border-line-strong"
            }`}
          />
          {noteBlocked ? (
            <p id="plan-note-guard" role="status" className="mt-2 flex items-start gap-1.5 text-caption text-ink">
              <WarningCircle size={ICON.sm} className="mt-px shrink-0 text-alert" aria-hidden />
              Numbers and links can&apos;t be shared here. It keeps both of you safe.
            </p>
          ) : null}
        </div>

        {day && time && venue ? (
          <section aria-label="Booking summary" className="rounded-card bg-surface p-4 ring-[1.5px] ring-line">
            <div className="flex items-baseline justify-between">
              <span className=" text-ink">Session fee</span>
              <span className="text-section text-ink">{rupees(sessionFee(companion, minutes))}</span>
            </div>
            <p className="mt-1 text-caption text-ink-2">
              {minutes} minutes at {venue.name}. Sample fee. Pay by UPI or card; nothing is charged until {companion.name} confirms.
            </p>
            <p className="mt-3 text-body text-ink">Free to cancel up to 24 hours before.</p>
            <p className="mt-1 text-body text-ink">
              Public venue only. Keep it on Beside. Conversation only. Respect a no. Check-ins stay on.
            </p>
          </section>
        ) : null}
      </div>

      <BottomBar>
        <Button disabled={!!reason} reason={reason} onClick={() => setSent(true)}>
          Send request
        </Button>
      </BottomBar>
    </div>
  );
}
