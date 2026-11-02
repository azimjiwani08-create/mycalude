import type { ReactNode } from "react";

/** 390px phone frame centred on desktop, full-bleed on phones. */
export function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div data-screen className="mx-auto flex min-h-[100dvh] w-full flex-col bg-canvas sm:max-w-[390px] sm:border-x sm:border-line">
      {children}
    </div>
  );
}

/** Sticky bottom action bar. Sticky (not fixed) so it always matches the frame width. */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div
      className="sticky bottom-0 z-20 mt-auto border-t-[1.5px] border-line px-5 pb-safe pt-3 bg-canvas"
    >
      {children}
    </div>
  );
}

export function TopBar({ children }: { children: ReactNode }) {
  return <div className="flex min-h-14 items-center gap-3 px-5 pt-3">{children}</div>;
}
