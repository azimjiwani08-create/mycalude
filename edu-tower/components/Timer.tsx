"use client";
import { useEffect, useRef, useState } from "react";

export function Timer({ minutes, onExpire }: { minutes: number; onExpire: () => void }) {
  const end = useRef(Date.now() + minutes * 60_000);
  const [left, setLeft] = useState(minutes * 60);
  const fired = useRef(false);
  useEffect(() => {
    const t = setInterval(() => {
      const s = Math.max(0, Math.round((end.current - Date.now()) / 1000));
      setLeft(s);
      if (s === 0 && !fired.current) {
        fired.current = true;
        onExpire();
      }
    }, 500);
    return () => clearInterval(t);
  }, [onExpire]);
  const m = Math.floor(left / 60);
  const s = left % 60;
  return <span className={`timer ${left < 120 ? "low" : ""}`} aria-live="off">⏱ {m}:{String(s).padStart(2, "0")}</span>;
}
