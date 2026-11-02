"use client";

import { useCallback, useSyncExternalStore } from "react";

const noSubscribe = () => () => {};
const today = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;
const FORMAT = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

/**
 * Labels sample dates relative to today, like "Sat, 2 Nov". The clock is read
 * only in the browser, so prerendered HTML stays stable and labels fill in on hydration.
 */
export function useDayLabel() {
  const now = useSyncExternalStore(
    noSubscribe,
    () => today,
    () => null,
  );
  return useCallback((offset: number) => (now === null ? "" : FORMAT.format(now + offset * DAY_MS)), [now]);
}

/** Whether a companion's Monday-first availability includes today (false until hydrated). */
export function useOpenToday(availability: boolean[]) {
  const now = useSyncExternalStore(
    noSubscribe,
    () => today,
    () => null,
  );
  if (now === null) return false;
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "Asia/Kolkata" }).format(now);
  return availability[["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekday)] ?? false;
}

export function RelativeDay({ offset }: { offset: number }) {
  return useDayLabel()(offset);
}
