import type { ReactNode } from "react";
import { MobileFrame } from "@/components/ui/Frame";
import { MemberGuard } from "@/components/member/MemberGuard";

export default function MemberLayout({ children }: { children: ReactNode }) {
  return (
    <MobileFrame>
      <MemberGuard>{children}</MemberGuard>
    </MobileFrame>
  );
}
