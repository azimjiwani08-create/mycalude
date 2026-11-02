"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Chip";

export function CheckInPrompt({ nextAt }: { nextAt: string }) {
  const [answer, setAnswer] = useState<"good" | "leave" | null>(null);

  return (
    <section aria-labelledby="checkin-title" className="rounded-card bg-surface p-4 ring-[1.5px] ring-line">
      <p className="text-caption uppercase tracking-wide text-ink-2">Check-in</p>
      <p id="checkin-title" className="mt-1 text-ink">
        How&apos;s it going?
      </p>
      <div aria-live="polite">
        {answer === null ? (
          <div className="mt-3 flex flex-wrap gap-2 py-1">
            <Chip onClick={() => setAnswer("good")}>All good</Chip>
            <Chip onClick={() => setAnswer("leave")}>I&apos;d like to leave</Chip>
          </div>
        ) : answer === "good" ? (
          <p className="mt-2 text-body text-ink-2">Thanks. Next check-in at {nextAt}.</p>
        ) : (
          <p className="mt-2 text-body text-ink-2">
            That&apos;s okay. Tap End session below. If you feel unsafe, hold the safety button.
          </p>
        )}
      </div>
    </section>
  );
}
