"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Photo-led screens run under the status bar on purpose: the feed with its welcome screen, and a companion's profile hero. */
const BLEED = [/^\/$/, /^\/companions\/[^/]+$/];

/** Marks the page so white screens reserve the status-bar space and photo screens don't. See globals.css. */
export function SafeArea() {
  const pathname = usePathname();
  const bleed = BLEED.some((re) => re.test(pathname));

  useEffect(() => {
    document.documentElement.toggleAttribute("data-bleed", bleed);
  }, [bleed]);

  return null;
}
