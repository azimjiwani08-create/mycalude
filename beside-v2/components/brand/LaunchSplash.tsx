"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * The logo on white for one second when the app opens, then it fades away.
 * Never shown over a live session: the SOS button must be reachable from the first frame.
 */
export function LaunchSplash() {
  const [shown, setShown] = useState(!usePathname().startsWith("/session/"));
  const reduce = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(() => setShown(false), 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {shown ? (
        <motion.div
          key="splash"
          data-splash
          aria-hidden
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.3, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-canvas"
        >
          <Logo className="text-[64px] text-ink" />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
