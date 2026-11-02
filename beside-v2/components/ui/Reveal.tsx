"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** One step of the welcome load-in cascade, about 60ms apart. */
export function Reveal({ index = 0, children, className }: { index?: number; children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
    >
      {children}
    </motion.div>
  );
}
