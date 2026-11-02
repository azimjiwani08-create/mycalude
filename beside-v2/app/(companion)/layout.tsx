import type { ReactNode } from "react";
import { MobileFrame } from "@/components/ui/Frame";

export default function CompanionLayout({ children }: { children: ReactNode }) {
  return <MobileFrame>{children}</MobileFrame>;
}
