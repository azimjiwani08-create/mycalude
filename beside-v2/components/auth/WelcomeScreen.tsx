"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { useSession } from "@/lib/session";

/** First screen when logged out: flat Beside Pink, the logo, one pill, one faint-glass panel. Nothing else. */
export function WelcomeScreen() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { update } = useSession();
  const [altNote, setAltNote] = useState(false);

  return (
    <main className="flex min-h-[100dvh] flex-col bg-pink">
      <div className="flex justify-center pt-[calc(20px+env(safe-area-inset-top))]">
        <span className="inline-flex h-8 items-center rounded-full border border-ink/20 px-3.5 text-caption text-ink">
          Verified people. Public places.
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center px-5">
        <Logo as="h1" className="text-[44px] text-ink" dotClassName="bg-white" />
      </div>

      <motion.div
        className="login-panel backdrop-blur-(--login-glass-blur) backdrop-saturate-110 mx-4 mb-[calc(16px+env(safe-area-inset-bottom))] rounded-card p-5"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <p className="text-center text-body text-white">Good company, in public places</p>
        <button
          type="button"
          onClick={() => {
            update({ intent: null, authMode: "join" });
            router.push("/login");
          }}
          className="mx-auto mt-4 block h-12 min-w-[240px] rounded-full bg-pink px-6 text-[15px] text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.35)] transition-transform duration-150 ease-out active:scale-[0.98] active:bg-pink-pressed"
        >
          Continue with phone number
        </button>
        <div className="mt-1 flex justify-center">
          <button type="button" onClick={() => setAltNote(true)} className="min-h-11 px-3 text-caption text-white underline underline-offset-2">
            Use a different method
          </button>
        </div>
        {altNote ? (
          <p role="status" className="pb-1 text-center text-caption text-white">
            Email sign-in is coming soon. For now, a phone number keeps everyone verifiable.
          </p>
        ) : null}
      </motion.div>
    </main>
  );
}
