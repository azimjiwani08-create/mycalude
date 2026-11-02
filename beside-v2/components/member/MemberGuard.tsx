"use client";

import { Activity, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SealCheck } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { BottomBar } from "@/components/ui/Frame";
import { useSession } from "@/lib/session";
import { ICON } from "@/lib/icons";

/**
 * Member screens show only to verified viewers. Until then the segment stays
 * mounted but hidden (effects paused), so it appears instantly on verify.
 * Sharp photos stay safe because UnlockImage checks `verified` itself.
 */
export function MemberGuard({ children }: { children: ReactNode }) {
  const { hydrated, verified } = useSession();
  const show = hydrated && verified;

  return (
    <>
      <Activity mode={show ? "visible" : "hidden"}>{children}</Activity>
      {show ? null : <Gate hydrated={hydrated} />}
    </>
  );
}

function Gate({ hydrated }: { hydrated: boolean }) {
  const { update } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  if (!hydrated) {
    return (
      <div aria-busy="true" aria-label="Loading" className="space-y-4 px-5 pt-16">
        <div className="skeleton aspect-[4/5] rounded-card" />
        <div className="skeleton h-7 w-1/3 rounded-md" />
        <div className="skeleton h-4 w-2/3 rounded-md" />
      </div>
    );
  }

  const companionId = pathname.startsWith("/companions/") ? pathname.split("/")[2] : null;
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="px-5 pt-20">
        <span className="flex size-12 items-center justify-center rounded-full bg-pink-tint text-ink">
          <SealCheck size={ICON.lg} aria-hidden />
        </span>
        <h1 className="mt-6 font-serif text-headline text-ink">Verify to see full profiles.</h1>
        <p className="mt-2 text-ink-2">
          Profiles, chat and sessions are for verified members. It takes about three minutes.
        </p>
      </div>
      <BottomBar>
        <div className="space-y-1">
          <Button
            onClick={() => {
              update({ intent: { companionId, scrollIndex: 0 }, authMode: "join" });
              router.push("/login");
            }}
          >
            Continue with phone number
          </Button>
          <Button variant="ghost" href="/">
            Back to Beside
          </Button>
        </div>
      </BottomBar>
    </div>
  );
}
