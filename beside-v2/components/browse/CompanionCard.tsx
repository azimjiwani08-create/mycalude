"use client";

import { useRef, useState, type PointerEvent, type UIEvent } from "react";
import Image from "next/image";
import { CaretDown, IdentificationCard, MapPin, Pause, Play, SealCheck } from "@phosphor-icons/react/ssr";
import { useReducedMotion } from "framer-motion";
import { livePhotos, type FeedCompanion } from "@/data/companions";
import { UnlockImage } from "@/components/photo/UnlockImage";
import { useOpenToday } from "@/lib/dates";
import { ICON } from "@/lib/icons";
import { useHello, VoiceHello } from "./VoiceHello";

const TAP_PX = 10;
const HIDDEN_BUTTON =
  "sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-14 focus-visible:z-20 focus-visible:flex focus-visible:h-11 focus-visible:items-center focus-visible:rounded-full focus-visible:bg-white focus-visible:px-4 focus-visible:text-caption focus-visible:text-ink";

/** The scroll cue shows on the first view only, and goes for good after the first scroll. */
let cueSeen = false;

type CompanionCardProps = {
  companion: FeedCompanion;
  /** The first card loads straight away and carries the scroll cue; the rest wait until they scroll near. */
  priority?: boolean;
  onOpen: () => void;
};

/**
 * One companion, as a normal page: a photo block, then a separate details block below it.
 * Touching the photo scrolls her photos; touching anything else scrolls the page. Horizontal swipes
 * belong to the feed, so the browser's own direction lock decides between them in the first few pixels.
 */
export function CompanionCard({ companion: c, priority, onOpen }: CompanionCardProps) {
  const reduce = useReducedMotion();
  const today = useOpenToday(c.availability);
  const player = useHello(c.voiceNote.durationSec, c.voiceNote.url);
  const photos = livePhotos(c);
  const count = photos.length;
  const scroller = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [index, setIndex] = useState(0);
  const [cue, setCue] = useState(priority && !cueSeen);

  const dismissCue = () => {
    cueSeen = true;
    setCue(false);
  };

  const onPhotoScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el.clientHeight) return;
    setIndex(Math.min(count - 1, Math.round(el.scrollTop / el.clientHeight)));
    dismissCue();
  };

  /** Photo n is at n * height. Reduce Motion jumps instead of sliding. */
  const goTo = (n: number) => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: Math.max(0, Math.min(count - 1, n)) * el.clientHeight, behavior: reduce ? "auto" : "smooth" });
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    start.current = { x: e.clientX, y: e.clientY };
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    const s = start.current;
    start.current = null;
    if (s && Math.abs(e.clientX - s.x) < TAP_PX && Math.abs(e.clientY - s.y) < TAP_PX) onOpen();
  };

  /** The photos hold on to the touch only between the first and last photo; at the ends the page takes over. */
  const handOff = index > 0 && index < count - 1 ? "overscroll-y-contain" : "overscroll-y-auto";

  return (
    <div onScroll={dismissCue} data-card-page className="no-scrollbar h-full overflow-y-auto overscroll-x-none pb-[calc(80px+env(safe-area-inset-bottom))]">
      {/* Block 1: the photos. Only these things sit on them, and the block clips everything. */}
      <article className="relative isolate aspect-[4/5] max-h-[52dvh] w-full overflow-hidden rounded-[28px] bg-ink">
        <div ref={scroller} onScroll={onPhotoScroll} data-card-scroller className={`no-scrollbar absolute inset-0 snap-y snap-mandatory overflow-y-auto ${handOff}`}>
          {photos.map((p, i) => (
            <div
              key={p.url}
              role="button"
              tabIndex={i === index ? 0 : -1}
              aria-hidden={i !== index || undefined}
              aria-label={`${c.name}, ${c.role}, photo ${i + 1} of ${count}. Open profile`}
              onPointerDown={down}
              onPointerUp={up}
              onPointerCancel={() => (start.current = null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpen();
                }
              }}
              className="relative h-full snap-start snap-always select-none bg-cover bg-center focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
              style={{ backgroundImage: `url(${p.softUrl})` }}
            >
              {Math.abs(i - index) <= 1 ? (
                <Image
                  src={p.url}
                  alt={i === index ? p.alt : ""}
                  fill
                  sizes="(max-width: 640px) 100vw, 358px"
                  priority={priority && i === 0}
                  draggable={false}
                  className="object-cover"
                />
              ) : null}
            </div>
          ))}
        </div>

        {/* A soft focus and a gradient over the bottom 40% only, so the name reads. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%]">
          <span className="feed-blur absolute inset-0" />
          <span className="photo-scrim absolute inset-0" />
        </div>

        <div className="pointer-events-none absolute left-3 right-3 top-3 flex gap-1.5">
          <span className="glass inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-caption">
            <SealCheck size={ICON.sm} weight="fill" aria-hidden /> Verified
          </span>
          {today ? <span className="glass inline-flex h-7 items-center rounded-full px-2.5 text-caption">Today</span> : null}
        </div>

        {count > 1 ? (
          <div aria-hidden data-photo-marks className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-1">
            {photos.map((p, i) => (
              <span key={p.url} className={`h-6 w-[3px] rounded-full ${i === index ? "bg-white" : "bg-white/35"}`} />
            ))}
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-x-4 bottom-4">
          <span className="block truncate font-serif text-[64px] leading-[68px] tracking-[-0.03em] text-pink-tint/90">{c.name}</span>
          <div className="flex h-12 items-center justify-between gap-3">
            <span className="min-w-0 flex-1 truncate text-body text-pink-tint">{c.role}</span>
            <span className="block shrink-0 rounded-full ring-[1.5px] ring-white/80">
              <UnlockImage companion={c} eager={priority} className="size-12 rounded-full" />
            </span>
            <button
              type="button"
              onClick={player.toggle}
              aria-label={player.playing ? "Pause voice note" : `Play voice note, ${c.voiceNote.durationSec} seconds`}
              aria-pressed={player.playing}
              className="pointer-events-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-pink text-ink transition-transform duration-150 ease-out active:scale-[0.98] active:bg-pink-pressed"
            >
              {player.playing ? <Pause size={ICON.md} weight="fill" aria-hidden /> : <Play size={ICON.md} weight="fill" aria-hidden />}
            </button>
          </div>
        </div>

        <button type="button" onClick={() => goTo(index - 1)} className={`${HIDDEN_BUTTON} left-3`}>
          Previous photo
        </button>
        <button type="button" onClick={() => goTo(index + 1)} className={`${HIDDEN_BUTTON} left-36`}>
          Next photo
        </button>
      </article>

      {/* The scroll cue lives in the 12px gap, so nothing moves when it goes. */}
      <div aria-hidden className="pointer-events-none relative h-3">
        <CaretDown
          size={24}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-ink/40 transition-opacity duration-300 ease-out motion-reduce:transition-none ${cue ? "opacity-100" : "opacity-0"}`}
        />
      </div>

      {/* Block 2: the details. A separate block under the photo, never over it. */}
      <section aria-label={`About ${c.name}`} className="rounded-[28px] border-[1.5px] border-line bg-white p-5">
        <VoiceHello name={c.name} seconds={c.voiceNote.durationSec} transcript={c.voiceNote.transcript} transcriptLabel="Show text" player={player} />
        <p className="mt-4 font-serif text-section text-ink">{c.prompt}</p>
        <ul aria-label="Languages" className="mt-6 flex flex-wrap gap-2">
          {c.languages.map((l) => (
            <li key={l} className="inline-flex h-8 items-center rounded-full px-3 text-caption text-ink ring-[1.5px] ring-line">
              {l}
            </li>
          ))}
        </ul>
        <ul aria-label="Verification" className="mt-4 flex flex-wrap gap-2">
          <li className="inline-flex h-8 items-center gap-1.5 rounded-full bg-pink-tint px-3 text-caption text-ink">
            <IdentificationCard size={ICON.sm} aria-hidden /> ID verified
          </li>
          <li className="inline-flex h-8 items-center gap-1.5 rounded-full bg-pink-tint px-3 text-caption text-ink">
            <MapPin size={ICON.sm} aria-hidden /> Public places only
          </li>
        </ul>
        <button
          type="button"
          onClick={onOpen}
          className="mt-6 h-14 w-full rounded-full bg-pink text-body text-ink transition-transform duration-150 ease-out active:scale-[0.98] active:bg-pink-pressed"
        >
          See full profile
        </button>
      </section>
    </div>
  );
}
