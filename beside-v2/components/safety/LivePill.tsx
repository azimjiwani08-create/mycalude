"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sessions } from "@/data/sessions";
import { useSession } from "@/lib/session";

/** Screens a member isn't using as a member: sign-in, companion and ops views. */
const HIDDEN_ON = ["/session/", "/login", "/verify", "/rules", "/requests", "/live", "/prototype"];

/**
 * Small alert-red pill on every member screen while a session is about to start or is live.
 * Prototype: the mock session marked `live` stands in for a real start time.
 */
export function LivePill() {
  const pathname = usePathname();
  const { hydrated, verified, liveEnded } = useSession();
  const live = sessions.find((s) => s.live);

  const visible = hydrated && verified && !liveEnded && !!live && !HIDDEN_ON.some((p) => pathname.startsWith(p));
  // The feed's header is transparent, with room for the pill. Other screens reserve a strip for it.
  const reserveStrip = visible && pathname !== "/";

  useEffect(() => {
    document.documentElement.toggleAttribute("data-live-strip", reserveStrip);
  }, [reserveStrip]);

  if (!visible || !live) return null;

  return (
    <Link
      href={`/session/${live.id}`}
      className="fixed left-1/2 top-[calc(6px+env(safe-area-inset-top))] z-50 flex h-11 -translate-x-1/2 items-center transition-transform duration-150 ease-out active:scale-[0.98]"
    >
      <span className="rounded-full bg-alert px-3 py-1.5 text-caption text-white">Live session</span>
    </Link>
  );
}
