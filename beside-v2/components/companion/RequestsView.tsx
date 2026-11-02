"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowClockwise, CaretRight, Tray } from "@phosphor-icons/react/ssr";
import type { SessionRequest } from "@/data/sessions";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { VerifiedBadge } from "@/components/ui/Badge";
import { useDayLabel } from "@/lib/dates";
import { initials } from "@/lib/format";
import { ICON } from "@/lib/icons";
import { BookingSheet } from "./BookingSheet";

type Upcoming = { id: string; memberName: string; dayOffset: number; time: string; venue: string; href: string };
type Status = "loading" | "ready" | "empty" | "error";

const BASE_UPCOMING: Upcoming[] = [
  { id: "s1", memberName: "Arjun", dayOffset: 0, time: "4:00 pm", venue: "Kitab Khana café, Fort", href: "/requests/s1" },
];

export function RequestsView({ initial }: { initial: SessionRequest[] }) {
  const dayLabel = useDayLabel();
  const [status, setStatus] = useState<Status>("loading");
  const [tab, setTab] = useState<"new" | "upcoming">("new");
  const [items, setItems] = useState(initial);
  const [upcoming, setUpcoming] = useState(BASE_UPCOMING);
  const [open, setOpen] = useState<SessionRequest | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const hold = useRef(false);

  // Prototype hook: ?state=loading|empty|error forces a list state for review.
  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("state");
    if (forced === "loading" || forced === "empty" || forced === "error") {
      hold.current = forced === "loading";
      // The URL is read after hydration so server and client markup match.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus(forced);
    }
  }, []);

  useEffect(() => {
    if (status !== "loading" || hold.current) return;
    const t = setTimeout(() => setStatus((s) => (s === "loading" ? "ready" : s)), 600);
    return () => clearTimeout(t);
  }, [status]);

  const accept = (r: SessionRequest) => {
    setItems((list) => list.filter((x) => x.id !== r.id));
    setUpcoming((list) => [
      ...list,
      { id: r.id, memberName: r.memberName, dayOffset: r.dayOffset, time: r.time, venue: `${r.venue.name}, ${r.venue.area}`, href: "/requests/s1" },
    ]);
    setOpen(null);
    setNotice(`Accepted. Your chat with ${r.memberName} is open.`);
  };

  const decline = (r: SessionRequest) => {
    setItems((list) => list.filter((x) => x.id !== r.id));
    setOpen(null);
    setNotice(`Declined. ${r.memberName} won't see a reason.`);
  };

  return (
    <main className="pb-16">
      <header className="px-5 pt-8">
        <p className="text-caption text-ink-2">Companion view · Meera</p>
        <h1 className="mt-1 font-serif text-headline text-ink">Requests</h1>
      </header>

      <div role="group" aria-label="Request lists" className="mt-5 flex gap-2 px-5 py-1">
        <Chip selected={tab === "new"} onClick={() => setTab("new")}>
          New{status === "ready" ? ` (${items.length})` : ""}
        </Chip>
        <Chip selected={tab === "upcoming"} onClick={() => setTab("upcoming")}>
          Upcoming ({upcoming.length})
        </Chip>
      </div>

      <p aria-live="polite" className="px-5">
        {notice ? (
          <span className="mt-4 block rounded-inner bg-pink-tint px-5 py-3 text-body text-ink">{notice}</span>
        ) : null}
      </p>

      <div className="mt-4 px-5">
        {tab === "upcoming" ? (
          <ul className="divide-y divide-line border-y-[1.5px] border-line">
            {upcoming.map((u) => (
              <li key={u.id}>
                <Link href={u.href} className="flex min-h-16 items-center gap-3 py-3 hover:bg-hover">
                  <Avatar name={u.memberName} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-ink">{u.memberName}</span>
                    <span className="block truncate text-caption text-ink-2">
                      {dayLabel(u.dayOffset)} · {u.time} · {u.venue}
                    </span>
                  </span>
                  <CaretRight size={ICON.md} className="text-ink-2" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        ) : status === "loading" ? (
          <ul aria-busy="true" aria-label="Loading requests" className="divide-y divide-line border-y-[1.5px] border-line">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex gap-3 py-4">
                <div className="skeleton size-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/3 rounded" />
                  <div className="skeleton h-3 w-2/3 rounded" />
                  <div className="skeleton h-3 w-4/5 rounded" />
                </div>
              </li>
            ))}
          </ul>
        ) : status === "error" ? (
          <div role="alert" className="border-y-[1.5px] border-line py-6">
            <p className=" text-ink">We couldn&apos;t load your requests.</p>
            <p className="mt-1 text-body text-ink-2">Check your connection and try again.</p>
            <div className="mt-4">
              <Button variant="secondary" onClick={() => setStatus("loading")}>
                <span className="flex items-center justify-center gap-2">
                  <ArrowClockwise size={ICON.md} aria-hidden /> Try again
                </span>
              </Button>
            </div>
          </div>
        ) : status === "empty" || items.length === 0 ? (
          <div className="border-y-[1.5px] border-line py-8 text-center">
            <Tray size={ICON.lg} className="mx-auto text-ink" aria-hidden />
            <p className="mt-3 text-ink">No new requests</p>
            <p className="mt-1 text-body text-ink-2">When members request a session, they&apos;ll show up here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line border-y-[1.5px] border-line">
            {items.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setOpen(r)}
                  className="flex w-full gap-3 py-4 text-left hover:bg-hover"
                >
                  <Avatar name={r.memberName} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className=" text-ink">{r.memberName}</span>
                      <span className="text-caption text-ink-2">{r.sentAgo}</span>
                    </span>
                    <span className="mt-1 block">
                      <VerifiedBadge label="ID verified" />
                    </span>
                    <span className="mt-2 block text-caption text-ink-2">
                      {dayLabel(r.dayOffset)} · {r.time} · {r.duration} · {r.venue.name}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-body text-ink">{r.note}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <BookingSheet request={open} onClose={() => setOpen(null)} onAccept={accept} onDecline={decline} />
    </main>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pink-tint text-ink"
    >
      {initials(name)}
    </span>
  );
}
