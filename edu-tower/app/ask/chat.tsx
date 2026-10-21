"use client";
import { useRef, useState } from "react";

interface Msg { who: "me" | "bot"; text: string; sources?: string[]; whatsapp?: string; handoff?: boolean }

const SUGGESTIONS = ["How much is the IELTS course?", "Which IELTS should I take?", "How does booking work?", "Can you help with my visa?"];

export function AskChat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    setBusy(true);
    setQ("");
    setMsgs((m) => [...m, { who: "me", text: question }, { who: "bot", text: "" }]);
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Something went wrong." }));
        setMsgs((m) => [...m.slice(0, -1), { who: "bot", text: err.error }]);
        return;
      }
      const meta = JSON.parse(decodeURIComponent(res.headers.get("x-edu-helper") ?? "%7B%7D"));
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        const shown = text.replace("[[handoff]]", "").trim();
        setMsgs((m) => [...m.slice(0, -1), { who: "bot", text: shown, sources: meta.sources, whatsapp: meta.whatsapp, handoff: meta.kind === "handoff" || text.includes("[[handoff]]") }]);
        endRef.current?.scrollIntoView({ block: "end" });
      }
    } catch {
      setMsgs((m) => [...m.slice(0, -1), { who: "bot", text: "We couldn't reach the helper. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 20 }}>
      {msgs.length === 0 && (
        <div className="row">
          {SUGGESTIONS.map((s) => <button key={s} className="pill blue" style={{ cursor: "pointer" }} onClick={() => ask(s)}>{s}</button>)}
        </div>
      )}
      <div className="chat" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={`bubble ${m.who}`}>
            {m.text || <span className="muted">…</span>}
            {m.who === "bot" && m.text && (
              <div className="row" style={{ marginTop: 10 }}>
                {!m.handoff && m.sources?.map((s) => <span key={s} className="pill green caption">From: {s}</span>)}
                {m.handoff && m.whatsapp && <a className="btn btn-primary btn-sm" href={m.whatsapp} target="_blank" rel="noopener noreferrer">Chat with a counsellor</a>}
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form className="row" style={{ flexWrap: "nowrap" }} onSubmit={(e) => { e.preventDefault(); ask(q); }}>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type your question" maxLength={500} aria-label="Your question" />
        <button className="btn btn-primary" disabled={busy || q.trim().length < 3}>Ask</button>
      </form>
      <p className="caption muted">Please don&apos;t share personal details here. We store questions without names or phone numbers.</p>
    </div>
  );
}
