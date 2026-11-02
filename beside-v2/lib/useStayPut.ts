"use client";

import { useEffect } from "react";

/**
 * iOS pans the page up when the keyboard opens, which slides the heading up behind the status bar.
 * Short forms with the field near the top call this to keep the page where it was.
 * Don't use it on long, scrolling screens.
 */
export function useStayPut() {
  useEffect(() => {
    const vv = window.visualViewport;
    const back = () => {
      if (window.scrollY > 0) window.scrollTo(0, 0);
    };
    window.addEventListener("scroll", back, { passive: true });
    vv?.addEventListener("resize", back);
    vv?.addEventListener("scroll", back);
    return () => {
      window.removeEventListener("scroll", back);
      vv?.removeEventListener("resize", back);
      vv?.removeEventListener("scroll", back);
    };
  }, []);
}
