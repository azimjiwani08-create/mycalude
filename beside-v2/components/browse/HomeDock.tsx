"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { House } from "@phosphor-icons/react/ssr";
import { scrollFeedToTop } from "@/lib/feed";
import { ICON } from "@/lib/icons";
import { useSession } from "@/lib/session";

/** A single frosted round home button. Everything else opens from the profile icon in the header. */
export function HomeDock() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { hydrated, verified } = useSession();

  // Dark frosted glass, so it reads over both a photo and the white details section. It lives on the feed only.
  if (!hydrated || !verified || pathname !== "/") return null;

  return (
    <nav aria-label="Main" className="fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2">
      <Link
        href="/"
        aria-label="Home"
        onClick={(e) => {
          e.preventDefault();
          scrollFeedToTop(reduce ? "auto" : "smooth");
        }}
        className="flex size-14 items-center justify-center rounded-full border border-white/20 bg-ink/70 text-white backdrop-blur-md transition-transform duration-150 ease-out active:scale-[0.98]"
      >
        <House size={ICON.md} weight="fill" aria-hidden />
      </Link>
    </nav>
  );
}
