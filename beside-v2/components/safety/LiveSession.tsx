"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, MapPin, ShieldCheck } from "@phosphor-icons/react/ssr";
import type { Companion } from "@/data/companions";
import type { Session } from "@/data/sessions";
import { Button, IconButton } from "@/components/ui/Button";
import { BottomBar, TopBar } from "@/components/ui/Frame";
import { Sheet } from "@/components/ui/Sheet";
import { ICON } from "@/lib/icons";
import { useSession } from "@/lib/session";
import { CheckInPrompt } from "./CheckInPrompt";
import { HoldToSos } from "./HoldToSos";

const STARTED_SECONDS_AGO = 24 * 60;

function formatElapsed(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function LiveSession({ session, companion }: { session: Session; companion: Companion }) {
  const [elapsed, setElapsed] = useState(STARTED_SECONDS_AGO);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const { update } = useSession();
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (ended) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [ended]);

  if (ended) {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <div className="px-5 pt-20">
          <span className="flex size-12 items-center justify-center rounded-full bg-pink-tint text-ink">
            <Check size={ICON.lg} aria-hidden />
          </span>
          <h1 className="mt-6 font-serif text-headline text-ink">Session ended</h1>
          <p className="mt-2 text-ink-2">
            You spent {Math.round(elapsed / 60)} minutes with {companion.name}. Your chat stays open for 24 hours.
          </p>
        </div>
        <BottomBar>
          <Button href={`/chat/${session.id}`}>
            Back to chat
          </Button>
        </BottomBar>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <TopBar>
        <IconButton label="Back to chat" href={`/chat/${session.id}`}>
          <ArrowLeft size={ICON.md} />
        </IconButton>
        <p className=" text-ink">Live session</p>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-pink-tint px-2.5 py-1 text-caption text-ink">
          <span aria-hidden className="size-1.5 rounded-full bg-pink" /> Live
        </span>
      </TopBar>

      <div className="space-y-6 px-5 pb-8 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-pink-tint p-5">
          <div className="min-w-0">
            <p className="text-caption text-ink">Session with {companion.name}</p>
            <p className="mt-1 font-serif text-headline tabular-nums text-ink" aria-live="off">
              {formatElapsed(elapsed)}
            </p>
            <p className="text-caption text-ink">
              of {session.duration}, until {session.endTime}
            </p>
            <p className="mt-2 flex items-center gap-1 text-caption text-ink">
              <MapPin size={ICON.sm} aria-hidden /> {session.venue.name}
            </p>
          </div>
          <HoldToSos sessionId={session.id} />
        </div>

        <Button variant="secondary" onClick={() => setConfirmEnd(true)}>
          End session
        </Button>

        <CheckInPrompt nextAt="4:45 pm" />

        <p className="flex items-start gap-2 text-caption text-ink-2">
          <ShieldCheck size={ICON.sm} className="mt-px shrink-0 text-ink" aria-hidden />
          Our safety team can see this session is live. Holding the SOS button alerts them right away.
        </p>
      </div>

      <Sheet open={confirmEnd} onClose={() => setConfirmEnd(false)} title="End this session now?">
        <p className="text-ink-2">You can end at any time, no reason needed. {companion.name} will see that it has ended.</p>
        <div className="mt-6 space-y-1">
          <Button
            onClick={() => {
              setConfirmEnd(false);
              setEnded(true);
              update({ liveEnded: true });
            }}
          >
            End session
          </Button>
          <Button variant="ghost" onClick={() => setConfirmEnd(false)}>
            Keep going
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
