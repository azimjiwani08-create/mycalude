"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { Button, IconButton } from "@/components/ui/Button";
import { BottomBar, TopBar } from "@/components/ui/Frame";
import { useSession } from "@/lib/session";
import { ICON } from "@/lib/icons";

const rules = [
  ["Public venues only", "Meet only at the venue on your booking. Never a home, car or hotel."],
  ["Keep it on Beside", "No numbers, socials or links. Chat and pay inside the app."],
  ["Conversation, nothing more", "Sessions are never romantic or physical. A handshake is the limit."],
  ["Respect a no", "Either person can pause or end a session at any time, no reason needed."],
  ["Check-ins stay on", "We check in during every session. Hold the safety button if you need us."],
];

export function RulesFlow() {
  const router = useRouter();
  const { intent, completeVerification } = useSession();
  const [checked, setChecked] = useState(false);

  const finish = () => {
    completeVerification();
    // Return to exactly where the gate opened: the tapped profile, or the rail.
    router.push(intent?.companionId ? `/companions/${intent.companionId}` : "/");
  };

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <TopBar>
        <IconButton label="Back" href="/verify">
          <ArrowLeft size={ICON.md} />
        </IconButton>
      </TopBar>
      <div className="px-5 pb-8 pt-6">
        <h1 className="font-serif text-headline text-ink">Five ground rules</h1>
        <p className="mt-2 text-ink-2">They keep every session comfortable for both people.</p>

        <ol className="mt-6 space-y-5">
          {rules.map(([title, detail], i) => (
            <li key={title} className="flex gap-3">
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pink-tint text-caption text-ink"
              >
                {i + 1}
              </span>
              <div>
                <p className=" text-ink">{title}</p>
                <p className="mt-0.5 text-body text-ink-2">{detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <label className="mt-8 flex min-h-11 cursor-pointer items-start gap-3 rounded-inner border-[1.5px] border-line bg-surface p-4">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-pink"
          />
          <span className="text-body text-ink">I&apos;ve read these and I agree to follow them.</span>
        </label>
      </div>
      <BottomBar>
        <div className="space-y-1">
          <Button disabled={!checked} reason="Tick the box above to continue." onClick={finish}>
            I agree and continue
          </Button>
          <Button variant="ghost" href="/legal#terms">
            Read full terms
          </Button>
        </div>
      </BottomBar>
    </div>
  );
}
