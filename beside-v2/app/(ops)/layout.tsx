import type { ReactNode } from "react";

/** Desktop ops view: full width up to 1440, sans only, no phone frame. */
export default function OpsLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-[100dvh] bg-canvas">{children}</div>;
}
