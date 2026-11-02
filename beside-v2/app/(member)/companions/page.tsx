import { YourPeople } from "@/components/member/YourPeople";

/** Member screens are gated on the client by MemberGuard, so skip instant-navigation validation. */
export const instant = false;

export default function CompanionsPage() {
  return <YourPeople />;
}
