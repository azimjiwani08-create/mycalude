import type { Metadata } from "next";
import { AskChat } from "./chat";

export const metadata: Metadata = { title: "Ask a question" };

export default function AskPage() {
  return (
    <div className="container section" style={{ maxWidth: 720 }}>
      <h1 className="display" style={{ fontSize: 40 }}>Ask us anything</h1>
      <p>Fees, timings, offices, which test to take. Answers come only from Edu Tower&apos;s approved information. If it&apos;s not there, we&apos;ll connect you with a counsellor.</p>
      <AskChat />
    </div>
  );
}
