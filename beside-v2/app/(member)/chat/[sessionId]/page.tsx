import { notFound } from "next/navigation";
import { getCompanion } from "@/data/companions";
import { getSession, sessions } from "@/data/sessions";
import { starters, threads } from "@/data/messages";
import { ChatThread } from "@/components/chat/ChatThread";

/** Member screens are gated on the client by MemberGuard, so skip instant-navigation validation. */
export const instant = false;

export function generateStaticParams() {
  return sessions.map((s) => ({ sessionId: s.id }));
}

export default async function MemberChatPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const session = getSession(sessionId);
  const companion = session && getCompanion(session.companionId);
  if (!session || !companion) notFound();

  return (
    <ChatThread
      session={session}
      companion={companion}
      initialMessages={threads[session.id] ?? []}
      starters={starters[session.id]}
      viewer="member"
      backHref={`/companions/${companion.id}`}
    />
  );
}
