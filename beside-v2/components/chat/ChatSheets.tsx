"use client";

import { useState } from "react";
import { Lifebuoy, MapPin, ShieldCheck } from "@phosphor-icons/react/ssr";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ICON } from "@/lib/icons";

const REASONS = [
  "Asked for my number or socials",
  "Tried to move the plan",
  "Made me uncomfortable",
  "Inappropriate messages",
  "Something else",
];

export function ReportSheet({ open, onClose, name }: { open: boolean; onClose: () => void; name: string }) {
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [sent, setSent] = useState(false);

  const close = () => {
    onClose();
    setTimeout(() => {
      setSent(false);
      setReason(null);
      setDetails("");
    }, 300);
  };

  return (
    <Sheet open={open} onClose={close} title={sent ? "Report sent" : `Report ${name}`}>
      {sent ? (
        <div aria-live="polite">
          <p className="text-ink">Thank you. Our safety team will review this within 2 hours and may contact you.</p>
          <p className="mt-2 text-caption text-ink-2">{name} hasn&apos;t been told and won&apos;t be.</p>
          <div className="mt-6">
            <Button onClick={close}>Done</Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-body text-ink-2">Reporting never notifies them.</p>
          <div role="radiogroup" aria-label="Reason" className="mt-4 flex flex-wrap gap-2 py-1">
            {REASONS.map((r) => (
              <Chip key={r} role="radio" aria-checked={reason === r} selected={reason === r} onClick={() => setReason(r)}>
                {r}
              </Chip>
            ))}
          </div>
          <label htmlFor="report-details" className="mt-5 block text-body text-ink">
            Anything else we should know? <span className="font-normal text-ink-2">(optional)</span>
          </label>
          <textarea
            id="report-details"
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="mt-2 block w-full resize-none rounded-inner border-[1.5px] border-line-strong bg-surface px-5 py-3 text-body text-ink"
          />
          <div className="mt-5">
            <Button disabled={!reason} reason="Choose a reason to send the report." onClick={() => setSent(true)}>
              Send report
            </Button>
          </div>
        </>
      )}
    </Sheet>
  );
}

export function SafetySheet({
  open,
  onClose,
  liveHref,
}: {
  open: boolean;
  onClose: () => void;
  liveHref?: string;
}) {
  const points = [
    { icon: Lifebuoy, text: "During a live session, hold the safety button for one second to alert our team." },
    { icon: MapPin, text: "Our team can see the venue and time of every confirmed session." },
    { icon: ShieldCheck, text: "Chat is masked. Neither of you can see the other's number." },
  ];
  return (
    <Sheet open={open} onClose={onClose} title="Safety on Beside">
      <ul className="space-y-3">
        {points.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3 text-body text-ink">
            <span className="mt-px flex size-7 shrink-0 items-center justify-center rounded-full bg-pink-tint text-ink">
              <Icon size={ICON.sm} aria-hidden />
            </span>
            {text}
          </li>
        ))}
      </ul>
      {liveHref ? (
        <div className="mt-6">
          <Button variant="secondary" href={liveHref}>
            Go to live session
          </Button>
        </div>
      ) : null}
    </Sheet>
  );
}
