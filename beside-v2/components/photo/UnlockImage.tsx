"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { photoAltAt, sharpPhoto, softPhoto, type Companion } from "@/data/companions";
import { useSession } from "@/lib/session";

type UnlockImageProps = {
  companion: Pick<Companion, "name" | "photos">;
  className?: string;
  eager?: boolean;
  /** Which of the companion's photos to show (carousel). */
  index?: number;
};

/**
 * Logged-out viewers only ever request the soft file. Once the phone is verified, the sharp
 * file mounts underneath and the soft one fades out (opacity only, 300ms).
 */
export function UnlockImage({ companion, className = "", eager = false, index = 0 }: UnlockImageProps) {
  const { verified, steps } = useSession();
  const reduce = useReducedMotion();
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  const sharpSrc = verified || steps.phone === "done" ? sharpPhoto(companion, index) : null;
  const revealed = sharpSrc !== null && loadedSrc === sharpSrc;

  return (
    <div className={`relative overflow-hidden bg-line ${className}`}>
      {sharpSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sharpSrc}
          alt={photoAltAt(companion, index)}
          onLoad={() => setLoadedSrc(sharpSrc)}
          className="absolute inset-0 size-full object-cover"
          draggable={false}
        />
      ) : null}
      <motion.img
        src={softPhoto(companion, index)}
        alt={revealed ? "" : `Soft-focus preview. ${photoAltAt(companion, index)}`}
        aria-hidden={revealed || undefined}
        loading={eager ? "eager" : "lazy"}
        draggable={false}
        initial={false}
        animate={{ opacity: revealed ? 0 : 1 }}
        transition={{ duration: reduce ? 0 : 0.3, ease: "easeOut" }}
        className="absolute inset-0 size-full object-cover"
      />
    </div>
  );
}
