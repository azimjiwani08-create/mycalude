"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** Isolated, memoised leaf so the dots never re-render the thread. */
export const TypingIndicator = memo(function TypingIndicator({ name }: { name: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex items-start" role="status">
      <span className="sr-only">{name} is typing</span>
      <div aria-hidden className="flex h-9 items-center gap-1 rounded-[20px] rounded-bl-[6px] border-[1.5px] border-line bg-surface px-3.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-ink-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={reduce ? { duration: 0 } : { duration: 0.2, delay: i * 0.08, ease: "easeOut" }}
          />
        ))}
      </div>
    </div>
  );
});
