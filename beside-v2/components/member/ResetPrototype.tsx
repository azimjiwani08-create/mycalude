"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/session";

export function ResetPrototype() {
  const { verified, reset } = useSession();
  const [done, setDone] = useState(false);

  return (
    <div className="mt-10" aria-live="polite">
      <p className="text-caption text-ink-2">
        {verified ? "You're signed in as a verified member." : "You're browsing logged out."}
      </p>
      <div className="mt-3">
        <Button
          variant="secondary"
          onClick={() => {
            reset();
            setDone(true);
          }}
        >
          {done ? "Prototype reset" : "Reset prototype"}
        </Button>
      </div>
    </div>
  );
}
