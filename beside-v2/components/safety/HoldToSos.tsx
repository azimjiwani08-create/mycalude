"use client";

import { useRef, useState } from "react";
import { animate, motion, useMotionValue, type AnimationPlaybackControls } from "framer-motion";
import { Siren } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { ICON } from "@/lib/icons";

export const SOS_STORAGE_KEY = "beside:sos";
const HOLD_SECONDS = 1;

/**
 * Press and hold for one second while a Bordo ring fills; release cancels. It stays
 * even with reduced motion, because it is the only feedback that the hold is working.
 */
export function HoldToSos({ sessionId }: { sessionId: string }) {
  const progress = useMotionValue(0);
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const holdingRef = useRef(false);
  const [holding, setHolding] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const fire = () => {
    holdingRef.current = false;
    setHolding(false);
    setTriggered(true);
    navigator.vibrate?.(150);
    try {
      localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify({ sessionId, at: Date.now() }));
    } catch {
      // Storage blocked: the alert still shows locally.
    }
  };

  const start = () => {
    if (triggered || holdingRef.current) return;
    holdingRef.current = true;
    setHolding(true);
    controls.current?.stop();
    controls.current = animate(progress, 1, {
      duration: HOLD_SECONDS * (1 - progress.get()),
      ease: "linear",
      onComplete: fire,
    });
  };

  const cancel = () => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setHolding(false);
    controls.current?.stop();
    controls.current = animate(progress, 0, { duration: 0.2, ease: "easeOut" });
  };

  const stand = () => {
    setTriggered(false);
    progress.set(0);
    try {
      localStorage.removeItem(SOS_STORAGE_KEY);
    } catch {
      // Nothing to clear.
    }
  };

  if (triggered) {
    return (
      <div role="alert" className="w-full rounded-inner border-[1.5px] border-alert bg-canvas p-4">
        <p className="flex items-center gap-2 text-ink">
          <Siren size={ICON.md} className="text-alert" aria-hidden />
          Safety team notified. Stay where you are.
        </p>
        <p className="mt-1 text-body text-ink-2">
          We&apos;re calling your phone now. If you can, stay somewhere public and visible.
        </p>
        <div className="mt-3">
          <Button variant="secondary" onClick={stand}>
            I&apos;m safe, cancel the alert
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <div className="relative p-1.5">
        <svg aria-hidden viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full -rotate-90">
          <motion.circle cx="50" cy="50" r="48" fill="none" stroke="var(--color-alert)" strokeWidth="3" style={{ pathLength: progress }} />
        </svg>
        <button
          type="button"
          aria-label="Safety button. Hold for one second to alert the safety team."
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            start();
          }}
          onPointerUp={cancel}
          onPointerCancel={cancel}
          onLostPointerCapture={cancel}
          onKeyDown={(e) => {
            if ((e.key === " " || e.key === "Enter") && !e.repeat) {
              e.preventDefault();
              start();
            }
          }}
          onKeyUp={(e) => {
            if (e.key === " " || e.key === "Enter") cancel();
          }}
          onBlur={cancel}
          onContextMenu={(e) => e.preventDefault()}
          className="flex size-[88px] touch-none select-none items-center justify-center rounded-full bg-alert text-section text-white transition-transform duration-150 ease-out active:scale-[0.98]"
        >
          SOS
        </button>
      </div>
      <p aria-live="polite" className="text-caption text-ink">
        {holding ? "Release to cancel" : "Hold to get help"}
      </p>
    </div>
  );
}
