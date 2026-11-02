"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, DotsThree, Flag, Lifebuoy, ShieldCheck } from "@phosphor-icons/react/ssr";
import type { Companion } from "@/data/companions";
import type { Session } from "@/data/sessions";
import { cannedReplies, quickReplies, type Message } from "@/data/messages";
import { IconButton } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { VerifiedBadge } from "@/components/ui/Badge";
import { UnlockImage } from "@/components/photo/UnlockImage";
import { initials, nowMinutes } from "@/lib/format";
import { ICON } from "@/lib/icons";
import { Bubble, SystemMessage } from "./Bubble";
import { Composer } from "./Composer";
import { ReportSheet, SafetySheet } from "./ChatSheets";
import { SafetyStrip } from "./SafetyStrip";
import { SessionCard } from "./SessionCard";
import { TypingIndicator } from "./TypingIndicator";

type Viewer = "member" | "companion";

type ChatThreadProps = {
  session: Session;
  companion: Companion;
  initialMessages: Message[];
  starters?: string[];
  viewer: Viewer;
  backHref: string;
};

const sameGroup = (a?: Message, b?: Message) =>
  !!a && !!b && a.from === b.from && a.from !== "system" && Math.abs(b.minutes - a.minutes) <= 2;

export function ChatThread({ session, companion, initialMessages, starters, viewer, backHref }: ChatThreadProps) {
  const reduce = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [typing, setTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [initialIds] = useState(() => new Set(initialMessages.map((m) => m.id)));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const replyIndex = useRef(0);
  const firstScroll = useRef(true);
  const moreRef = useRef<HTMLButtonElement>(null);

  const other: Viewer = viewer === "member" ? "companion" : "member";
  const otherName = viewer === "member" ? companion.name : session.memberName;
  const closed = session.chat === "closed";

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useLayoutEffect(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: firstScroll.current || reduce ? "auto" : "smooth",
    });
    firstScroll.current = false;
  }, [messages.length, typing, reduce]);

  const setStatus = useCallback((id: string, status: Message["status"]) => {
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, status } : m)));
  }, []);

  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

  // Prototype delivery: sending, sent, delivered, read, then the other side replies.
  const deliver = useCallback(
    (id: string, withReply: boolean) => {
      later(500, () => setStatus(id, "sent"));
      later(1200, () => setStatus(id, "delivered"));
      later(2400, () => setStatus(id, "read"));
      if (!withReply) return;
      later(2700, () => setTyping(true));
      later(4400, () => {
        setTyping(false);
        const pool = cannedReplies[other];
        const text = pool[replyIndex.current++ % pool.length];
        setMessages((list) => [...list, { id: `r${Date.now()}`, from: other, text, minutes: nowMinutes() }]);
      });
    },
    [other, setStatus],
  );

  const send = useCallback(
    (text: string) => {
      const id = `m${Date.now()}`;
      setMessages((list) => [...list, { id, from: viewer, text, minutes: nowMinutes(), status: "sending" }]);
      deliver(id, true);
    },
    [viewer, deliver],
  );

  const retry = useCallback(
    (id: string) => {
      setStatus(id, "sending");
      deliver(id, false);
    },
    [setStatus, deliver],
  );

  const hasConversation = messages.some((m) => m.from !== "system");

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-30 border-b-[1.5px] border-line bg-canvas">
        <div className="relative flex h-16 items-center gap-3 px-5">
          <IconButton label="Back" href={backHref} className="border-transparent bg-transparent">
            <ArrowLeft size={ICON.md} />
          </IconButton>
          {viewer === "member" ? (
            <UnlockImage companion={companion} className="size-10 shrink-0 rounded-full" />
          ) : (
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pink-tint text-ink"
            >
              {initials(session.memberName)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-ink">{otherName}</p>
              <VerifiedBadge />
            </div>
            <p className="truncate text-caption text-ink-2">
              {viewer === "member" ? companion.role : "Member · ID and selfie verified"}
            </p>
          </div>
          {viewer === "companion" ? (
            <IconButton label="Safety" onClick={() => setSafetyOpen(true)}>
              <Lifebuoy size={ICON.md} />
            </IconButton>
          ) : null}
          <IconButton
            ref={moreRef}
            label="More options"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="border-transparent bg-transparent"
          >
            <DotsThree size={ICON.lg} />
          </IconButton>
          {menuOpen ? (
            <>
              <div aria-hidden className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div
                role="menu"
                onKeyDown={(e) => e.key === "Escape" && setMenuOpen(false)}
                className="absolute right-4 top-14 z-40 w-52 rounded-inner bg-surface py-1 border-[1.5px] border-line ring-[1.5px] ring-line"
              >
                <button
                  role="menuitem"
                  autoFocus
                  onClick={() => {
                    setMenuOpen(false);
                    setReportOpen(true);
                  }}
                  className="flex h-11 w-full items-center gap-3 px-5 text-left text-ink hover:bg-hover"
                >
                  <Flag size={ICON.md} aria-hidden /> Report
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setSafetyOpen(true);
                  }}
                  className="flex h-11 w-full items-center gap-3 px-5 text-left text-ink hover:bg-hover"
                >
                  <ShieldCheck size={ICON.md} aria-hidden /> Safety
                </button>
              </div>
            </>
          ) : null}
        </div>
        <SafetyStrip />
      </header>

      <div className="flex-1 px-5 pb-6 pt-4">
        <SessionCard session={session} showLiveLink={session.live && !closed} />

        {!hasConversation && !closed ? (
          <div className="mt-10 text-center">
            <p className="mx-auto max-w-[30ch] text-ink-2">
              Say hello. A short note on what you&apos;d like to practice works well.
            </p>
            {starters?.length ? (
              <div className="mt-4 flex flex-col items-center gap-2">
                {starters.map((s) => (
                  <Chip key={s} onClick={() => send(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <ol className="mt-4" aria-label={`Messages with ${otherName}`} aria-live="polite">
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const first = !sameGroup(prev, m);
            const last = !sameGroup(m, next);
            const isNew = !initialIds.has(m.id);
            return (
              <motion.li
                key={m.id}
                className={first ? "mt-4" : "mt-1"}
                initial={isNew && !reduce ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                {m.from === "system" ? (
                  <SystemMessage text={m.text} />
                ) : (
                  <Bubble message={m} mine={m.from === viewer} last={last} onRetry={retry} />
                )}
              </motion.li>
            );
          })}
        </ol>
        {typing ? (
          <div className="mt-4">
            <TypingIndicator name={otherName} />
          </div>
        ) : null}
      </div>

      {closed ? (
        <div className="sticky bottom-0 z-20 border-t-[1.5px] border-line bg-surface px-5 pb-safe pt-4 text-center">
          <p className="text-body text-ink-2">This chat is closed. You can rebook from Sessions.</p>
        </div>
      ) : (
        <Composer onSend={send} quickReplies={hasConversation ? quickReplies : undefined} />
      )}

      <ReportSheet
        open={reportOpen}
        onClose={() => {
          setReportOpen(false);
          moreRef.current?.focus();
        }}
        name={otherName}
      />
      <SafetySheet
        open={safetyOpen}
        onClose={() => {
          setSafetyOpen(false);
          moreRef.current?.focus();
        }}
        liveHref={session.live && viewer === "member" ? `/session/${session.id}` : undefined}
      />
    </div>
  );
}
