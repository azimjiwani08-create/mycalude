import { notFound } from "next/navigation";
import { getCompanion } from "@/data/companions";
import { getSession, sessions } from "@/data/sessions";
import { threads } from "@/data/messages";
import { ChatThread } from "@/components/chat/ChatThread";

export function generateStaticParams() {
  return sessions.map((s) => ({ sessionId: s.id }));
}

/** The same thread, seen by the companion: her bubbles on the right. */
export default async function CompanionChatPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const session = getSession(sessionId);
  const companion = session && getCompanion(session.companionId);
  if (!session || !companion) notFound();

  return (
    <ChatThread
      session={session}
      companion={companion}
      initialMessages={threads[session.id] ?? []}
      viewer="companion"
      backHref="/requests"
    />
  );
}
