"use client";

import { CalendarBlank, Clock, MapPin } from "@phosphor-icons/react/ssr";
import type { SessionRequest } from "@/data/sessions";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { VerifiedBadge } from "@/components/ui/Badge";
import { useDayLabel } from "@/lib/dates";
import { ICON } from "@/lib/icons";

type BookingSheetProps = {
  request: SessionRequest | null;
  onClose: () => void;
  onAccept: (r: SessionRequest) => void;
  onDecline: (r: SessionRequest) => void;
};

export function BookingSheet({ request, onClose, onAccept, onDecline }: BookingSheetProps) {
  const dayLabel = useDayLabel();
  return (
    <Sheet open={!!request} onClose={onClose} title={request ? `${request.memberName}'s request` : ""}>
      {request ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <VerifiedBadge label={request.verification} />
            <span className="text-caption text-ink-2">{request.since}</span>
          </div>
          <ul className="mt-4 space-y-2">
            {[
              [CalendarBlank, dayLabel(request.dayOffset)],
              [Clock, `${request.time} · ${request.duration}`],
              [MapPin, `${request.venue.name}, ${request.venue.area}`],
            ].map(([Icon, text]) => {
              const I = Icon as typeof MapPin;
              return (
                <li key={text as string} className="flex items-center gap-2.5 text-body text-ink">
                  <I size={ICON.md} className="shrink-0 text-ink" aria-hidden />
                  {text as string}
                </li>
              );
            })}
          </ul>
          <blockquote className="mt-4 rounded-inner bg-canvas px-5 py-3 text-body text-ink">
            {request.note}
          </blockquote>
          <p className="mt-3 text-caption text-ink-2">
            Accepting opens a chat on Beside. You can still end any session at any time.
          </p>
          <div className="mt-5 space-y-2">
            <Button onClick={() => onAccept(request)}>Accept</Button>
            <Button variant="secondary" onClick={() => onDecline(request)}>
              Decline
            </Button>
          </div>
        </>
      ) : null}
    </Sheet>
  );
}
