"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowClockwise, User } from "@phosphor-icons/react/ssr";
import type { FeedCompanion } from "@/data/companions";
import { WelcomeScreen } from "@/components/auth/WelcomeScreen";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/brand/Logo";
import { useSession } from "@/lib/session";
import { ICON } from "@/lib/icons";
import { FEED_ID, scrollFeedTo, scrollFeedToTop } from "@/lib/feed";
import { lightHaptic } from "@/lib/haptics";
import { CompanionCard } from "./CompanionCard";

type Status = "loading" | "ready" | "empty" | "error";

/** The first load in a tab shows the skeleton; later visits render straight away. */
let loadedOnce = false;

/** A quiet directory of verified companions in the member's city. No rates, no ratings. */
export function BrowseFeed({ companions }: { companions: FeedCompanion[] }) {
  const router = useRouter();
  const { hydrated, verified, intent, justUnlocked, update, clearUnlock } = useSession();
  const [status, setStatus] = useState<Status>(loadedOnce ? "ready" : "loading");
  const [toast, setToast] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const reduce = useReducedMotion();
  const holdLoading = useRef(false);
  const list = useRef<HTMLUListElement>(null);

  // Prototype hook: ?rail=loading|empty|error forces a list state for review.
  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("rail");
    if (forced === "loading" || forced === "empty" || forced === "error") {
      holdLoading.current = forced === "loading";
      // The URL is read after hydration so server and client markup match.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus(forced);
    }
  }, []);

  useEffect(() => {
    if (status !== "loading" || holdLoading.current) return;
    const t = setTimeout(() => {
      loadedOnce = true;
      setStatus((s) => (s === "loading" ? "ready" : s));
    }, 700);
    return () => clearTimeout(t);
  }, [status]);

  // Back from the gate: the intent has done its job.
  useEffect(() => {
    if (verified && intent) update({ intent: null });
  }, [verified, intent, update]);

  useEffect(() => {
    if (!justUnlocked) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToast(true);
    const a = setTimeout(clearUnlock, 1600);
    const b = setTimeout(() => setToast(false), 4000);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [justUnlocked, clearUnlock]);

  // Which card is in view: it scales to full size and gets a light tap on arrival.
  useEffect(() => {
    const ul = list.current;
    if (status !== "ready" || !ul) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.index);
          setActiveIndex((prev) => {
            if (prev !== i) void lightHaptic();
            return i;
          });
        }
      },
      { root: ul, threshold: 0.6 },
    );
    ul.querySelectorAll("[data-index]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [status, companions.length]);

  if (hydrated && !verified) return <WelcomeScreen />;

  return (
    <>
      <div className="relative h-[100dvh] overflow-hidden bg-(--feed-bg)">
        <header className="pointer-events-none absolute inset-x-0 top-0 z-30 pt-[env(safe-area-inset-top)]">
          <div className="flex h-14 items-center justify-between px-4">
            <Logo className="text-[28px] text-ink" />
            <Link href="/profile" aria-label="Your profile" className="pointer-events-auto flex size-11 items-center justify-center rounded-full bg-pink-tint">
              <User size={ICON.md} className="text-ink" aria-hidden />
            </Link>
          </div>
        </header>

        <h1 className="sr-only">Companions in Mumbai</h1>
        <div className="contents">
          {[
            { label: "Previous companion", to: activeIndex - 1, show: activeIndex > 0 },
            { label: "Next companion", to: activeIndex + 1, show: activeIndex < companions.length },
          ].map((b) =>
            b.show ? (
              <button
                key={b.label}
                type="button"
                onClick={() => scrollFeedTo(b.to, reduce ? "auto" : "smooth")}
                className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-1/2 focus-visible:top-[calc(env(safe-area-inset-top)+72px)] focus-visible:z-40 focus-visible:h-11 focus-visible:-translate-x-1/2 focus-visible:rounded-full focus-visible:bg-white focus-visible:px-4 focus-visible:text-caption focus-visible:text-ink"
              >
                {b.label}
              </button>
            ) : null,
          )}
        </div>

        {toast ? (
          <p role="status" className="absolute inset-x-4 top-[calc(72px+env(safe-area-inset-top))] z-30 rounded-inner bg-pink-tint px-5 py-3 text-body text-ink">
            <span className="flex items-center gap-2">
              <DrawnTick />
              You&apos;re verified. Full photos are unlocked.
            </span>
          </p>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top)+68px)]">
          {status === "loading" ? (
            <div aria-busy="true" aria-label="Loading companions" className="h-[calc(100%-52px)] px-4 pb-3">
              <div className="skeleton h-full rounded-[32px]" />
            </div>
          ) : status === "error" ? (
            <div className="flex h-full items-center px-4">
              <div role="alert" className="w-full rounded-card bg-canvas p-5">
                <p className="text-body text-ink">We couldn&apos;t load companions.</p>
                <p className="mt-1 text-body text-ink-2">Check your connection and try again.</p>
                <div className="mt-4">
                  <Button variant="secondary" onClick={() => setStatus("loading")}>
                    <span className="flex items-center justify-center gap-2">
                      <ArrowClockwise size={ICON.md} aria-hidden /> Try again
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          ) : status === "empty" || companions.length === 0 ? (
            <div className="flex h-full items-center px-4">
              <div className="w-full rounded-card bg-canvas p-5">
                <p className="text-body text-ink">No companions in your area yet</p>
                <p className="mt-1 text-body text-ink-2">We&apos;re verifying new companions every week.</p>
              </div>
            </div>
          ) : (
            /* Horizontal snap, one companion per screen. Each card is 16px narrower than the padded list, so 24px of the next one shows. */
            <ul
              id={FEED_ID}
              ref={list}
              aria-label="Companions"
              className="no-scrollbar relative flex h-full snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-pl-4 px-4 pb-[calc(12px+env(safe-area-inset-bottom))]"
            >
              {companions.map((c, i) => (
                <li
                  key={c.id}
                  data-index={i}
                  aria-current={i === activeIndex || undefined}
                  className={`h-full w-[calc(100%-16px)] shrink-0 snap-start snap-always transition-[transform,opacity] duration-250 ease-out motion-reduce:transition-none ${
                    i === activeIndex ? "scale-100 opacity-100" : "origin-left scale-[0.96] opacity-70"
                  }`}
                >
                  {Math.abs(i - activeIndex) <= 1 ? (
                    <CompanionCard companion={c} priority={i === 0} onOpen={() => router.push(`/companions/${c.id}`)} />
                  ) : (
                    <div className="h-full rounded-[32px] bg-ink/10" />
                  )}
                </li>
              ))}
              <li role="presentation" className="flex h-full w-[calc(100%-16px)] shrink-0 snap-start snap-always flex-col items-center justify-center gap-4 px-8 text-center">
                <p className="font-serif text-headline text-ink">That&apos;s everyone for now</p>
                <button
                  type="button"
                  onClick={() => scrollFeedToTop(reduce ? "auto" : "smooth")}
                  className="h-12 rounded-full bg-ink px-6 text-body text-white transition-transform duration-150 ease-out active:scale-[0.98]"
                >
                  Back to the first
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

/** The verified tick draws itself once. */
function DrawnTick() {
  const reduce = useReducedMotion();
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <motion.path d="M5 13l4 4L19 7" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, ease: "easeOut" }} />
    </svg>
  );
}
