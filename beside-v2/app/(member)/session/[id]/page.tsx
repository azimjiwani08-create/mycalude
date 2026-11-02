import { notFound } from "next/navigation";
import { getCompanion } from "@/data/companions";
import { getSession, sessions } from "@/data/sessions";
import { LiveSession } from "@/components/safety/LiveSession";

/** Member screens are gated on the client by MemberGuard, so skip instant-navigation validation. */
export const instant = false;

export function generateStaticParams() {
  return sessions.map((s) => ({ id: s.id }));
}

export default async function LiveSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = getSession(id);
  const companion = session && getCompanion(session.companionId);
  if (!session || !companion) notFound();

  return <LiveSession session={session} companion={companion} />;
}
