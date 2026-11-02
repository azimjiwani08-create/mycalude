"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookmarkSimple, ShareNetwork } from "@phosphor-icons/react/ssr";
import { livePhotos, type Companion } from "@/data/companions";
import { UnlockImage } from "@/components/photo/UnlockImage";
import { useSession } from "@/lib/session";
import { ICON } from "@/lib/icons";

/** Full-bleed 4:5 photo carousel with floating glass back, save and share. */
export function ProfileHero({ companion: c }: { companion: Companion }) {
  const { savedIds, toggleSaved } = useSession();
  const saved = savedIds.includes(c.id);
  const count = livePhotos(c).length;
  const [page, setPage] = useState(0);
  const [shared, setShared] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const slides = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!track.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setPage(Number((e.target as HTMLElement).dataset.page));
      },
      { root: track.current, threshold: 0.6 },
    );
    slides.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: `${c.name} on Beside`, url });
      else await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // Share sheet dismissed: nothing to do.
    }
  };

  const circle =
    "glass flex size-11 items-center justify-center rounded-full transition-transform duration-150 active:scale-[0.98]";

  return (
    <div className="relative">
      <div ref={track} aria-label={`${c.name}'s photos`} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              slides.current[i] = el;
            }}
            data-page={i}
            className="w-full shrink-0 snap-start"
          >
            <UnlockImage companion={c} index={i} eager={i === 0} className="aspect-[4/5]" />
          </div>
        ))}
      </div>

      <div className="absolute inset-x-4 top-[calc(12px+env(safe-area-inset-top))] flex justify-between">
        <Link href="/" aria-label="Back" className={circle}>
          <ArrowLeft size={ICON.md} />
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => toggleSaved(c.id)}
            aria-label={saved ? `Saved ${c.name}` : `Save ${c.name}`}
            aria-pressed={saved}
            className={circle}
          >
            <BookmarkSimple size={ICON.md} weight={saved ? "fill" : "regular"} />
          </button>
          <button type="button" onClick={share} aria-label={shared ? "Link shared" : `Share ${c.name}'s profile`} className={circle}>
            <ShareNetwork size={ICON.md} />
          </button>
        </div>
      </div>

      {/* Dots sit just above the sheet that overlaps the lower third. */}
      <div aria-hidden className="absolute inset-x-0 bottom-[calc(min(41.6vw,162px)+14px)] flex justify-center gap-1.5">
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={`size-1.5 rounded-full ${i === page ? "bg-canvas" : "bg-canvas/45"}`} />
        ))}
      </div>
      <span className="sr-only" aria-live="polite">
        Photo {page + 1} of {count}
      </span>
    </div>
  );
}
