import { ProfileScreen } from "@/components/member/ProfileScreen";

/** Member screens are gated on the client by MemberGuard, so skip instant-navigation validation. */
export const instant = false;

export default function ProfilePage() {
  return <ProfileScreen />;
}
