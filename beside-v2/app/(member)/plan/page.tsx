import { PlanFlow } from "@/components/member/PlanFlow";

/** Member screens are gated on the client by MemberGuard, so skip instant-navigation validation. */
export const instant = false;

export default function PlanPage() {
  return <PlanFlow />;
}
