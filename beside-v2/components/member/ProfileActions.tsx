"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/session";

/** Fixed bar with the one primary action. The session fee appears only on the booking summary. */
export function ProfileActions({ companionId }: { companionId: string }) {
  const router = useRouter();
  const { update } = useSession();

  return (
    <div className="fixed bottom-0 left-1/2 z-30 flex w-full -translate-x-1/2 items-center border-t-[1.5px] border-line bg-canvas px-5 pb-safe pt-3 sm:max-w-[390px]">
      <div className="min-w-0 flex-1">
        <Button
          onClick={() => {
            update({ planCompanionId: companionId });
            router.push("/plan");
          }}
        >
          Request a session
        </Button>
      </div>
    </div>
  );
}
