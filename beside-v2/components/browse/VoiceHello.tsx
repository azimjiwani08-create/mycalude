"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Pause, Play } from "@phosphor-icons/react/ssr";
import { ICON } from "@/lib/icons";

/** Fixed bar heights so the waveform is stable between renders (no random values in render). */
const BARS = [0.35, 0.6, 0.45, 0.8, 0.55, 0.95, 0.7, 0.4, 0.65, 0.9, 0.5, 0.75, 0.6, 0.85, 0.45, 0.7, 1, 0.55, 0.4, 0.75, 0.6, 0.5, 0.8, 0.35];

/**
 * Playback shared by the profile player and the feed details. Audio never starts by itself, and the
 * file is only fetched on the first tap. With no file yet (url empty) playback is simulated with a timer.
 */
export function useHello(seconds: number, url = "") {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => audio.current?.pause(), []);

  const toggle = () => {
    if (!url) return setPlaying((p) => !p);
    if (!audio.current) {
      const a = new Audio(url);
      a.preload = "none";
      a.ontimeupdate = () => setElapsed(a.currentTime);
      a.onended = () => {
        setPlaying(false);
        setElapsed(0);
      };
      audio.current = a;
    }
    if (audio.current.paused) {
      void audio.current.play();
      setPlaying(true);
    } else {
      audio.current.pause();
      setPlaying(false);
    }
  };

  useEffect(() => {
    if (!playing || url) return;
    const t = setInterval(() => {
      setElapsed((e) => {
        if (e + 0.1 >= seconds) {
          setPlaying(false);
          return 0;
        }
        return e + 0.1;
      });
    }, 100);
    return () => clearInterval(t);
  }, [playing, seconds, url]);

  return { playing, elapsed, toggle };
}

type VoiceHelloProps = {
  name: string;
  seconds: number;
  transcript?: string;
  /** The audio file. Empty while there are no uploads: playback is then simulated. */
  url?: string;
  /** Text of the toggle that reveals the transcript. */
  transcriptLabel?: string;
  /** Share one player between this pill and another control (the feed card's play button). */
  player?: ReturnType<typeof useHello>;
  /** When set (logged out), tapping opens the gate instead of playing. */
  onLockedTap?: () => void;
};

/**
 * The 15-second hello, recorded in-app and reviewed before it goes live.
 * Prototype: playback is simulated with a timer; there is no audio file yet.
 */
export function VoiceHello({ name, seconds, transcript, url, transcriptLabel = "Read what she says", player, onLockedTap }: VoiceHelloProps) {
  const reduce = useReducedMotion();
  const own = useHello(seconds, url);
  const { playing, elapsed, toggle } = player ?? own;

  const shown = playing ? Math.ceil(seconds - elapsed) : seconds;

  return (
    <div>
    <button
      type="button"
      onClick={() => (onLockedTap ? onLockedTap() : toggle())}
      aria-label={playing ? "Pause voice note" : `Play voice note, ${seconds} seconds`}
      aria-pressed={playing}
      className="flex w-full items-center gap-3 h-14 rounded-full bg-surface p-1.5 text-left ring-[1.5px] ring-line transition-transform duration-150 active:scale-[0.98]"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-pink text-ink">
        {playing ? <Pause size={ICON.md} weight="fill" aria-hidden /> : <Play size={ICON.md} weight="fill" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="relative flex h-5 items-center gap-[3px]" aria-hidden>
          {BARS.map((h, i) => (
            <motion.span
              key={i}
              className="w-[3px] origin-center rounded-full bg-pink"
              style={{ height: `${h * 100}%` }}
              animate={playing && !reduce ? { scaleY: [1, 0.45, 1] } : { scaleY: 1 }}
              transition={
                playing && !reduce ? { duration: 0.9, repeat: Infinity, delay: (i % 6) * 0.08, ease: "easeInOut" } : { duration: 0 }
              }
            />
          ))}
          {/* Progress fill moves with scaleX only. */}
          <motion.span
            className="pointer-events-none absolute inset-y-0 left-0 w-full origin-left rounded-full bg-pink/10"
            initial={false}
            animate={{ scaleX: playing ? elapsed / seconds : 0 }}
            transition={{ duration: reduce ? 0 : 0.1, ease: "linear" }}
          />
        </span>
        <span className="mt-0.5 block text-caption text-ink-2">
          Hear {name} say hello · 0:{String(shown).padStart(2, "0")}
        </span>
      </span>
    </button>
    {transcript ? (
      <details className="mt-1 px-1">
        <summary className="flex min-h-11 cursor-pointer items-center text-body text-ink">{transcriptLabel}</summary>
        <p className="pb-2 text-body text-ink-2">{transcript}</p>
      </details>
    ) : null}
    </div>
  );
}
