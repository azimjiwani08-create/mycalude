"use client";
import Link from "next/link";
import { useCallback, useState } from "react";
import { api } from "@/components/api";
import { Progress, SKILL_LABEL } from "@/components/ui";
import { ListenPlayer } from "@/components/ListenPlayer";
import { SpeakingRecorder } from "@/components/SpeakingRecorder";
import { Timer } from "@/components/Timer";
import type { PublicQuestion, Skill, Test } from "@/lib/types";

const ORDER: Skill[] = ["listening", "reading", "writing", "speaking"]; // real IELTS order

export function MockRunner({ test, questions }: { test: Test; questions: PublicQuestion[] }) {
  const sections = ORDER.filter((s) => questions.some((q) => q.skill === s));
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [writing, setWriting] = useState("");
  const [speech, setSpeech] = useState<{ audio: Blob | null; transcript: string }>({ audio: null, transcript: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    if (busy || done) return;
    setBusy(true); setError(null);
    try {
      const form = new FormData();
      form.set("test_id", test.id);
      form.set("answers", JSON.stringify(answers));
      form.set("writing", writing);
      form.set("speaking_text", speech.transcript);
      if (speech.audio && speech.audio.size) form.set("audio", new File([speech.audio], "speaking.webm", { type: speech.audio.type.split(";")[0] || "audio/webm" }));
      await api("/api/mock/submit", { method: "POST", body: form });
      setDone(true);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }, [busy, done, test.id, answers, writing, speech]);

  if (done) {
    return (
      <div className="stack" style={{ gap: 20 }}>
        <h1 className="display" style={{ fontSize: 40 }}>Submitted!</h1>
        <p>Reading and listening are marked already. Your writing and speaking have an AI estimate and are now with your teacher for review — you&apos;ll get a WhatsApp message when they&apos;re released.</p>
        <Link href="/portal" className="btn btn-primary">Back to my portal</Link>
      </div>
    );
  }
  if (!started) {
    return (
      <div className="stack" style={{ gap: 20 }}>
        <h1 className="display" style={{ fontSize: 40 }}>{test.title}</h1>
        <p>{sections.map((s) => SKILL_LABEL[s]).join(" → ")} · <strong>{test.duration_min} minutes</strong>. The timer starts when you press start and submits automatically at zero. Listening plays twice.</p>
        <button className="btn btn-primary" onClick={() => setStarted(true)}>Start the test</button>
      </div>
    );
  }

  const skill = sections[i];
  const qs = questions.filter((q) => q.skill === skill);
  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="row between"><span className="pill blue">{SKILL_LABEL[skill]} · part {i + 1} of {sections.length}</span><Timer minutes={test.duration_min} onExpire={submit} /></div>
      <Progress value={i + 1} max={sections.length} />
      {skill === "listening" && <div className="card blue stack"><ListenPlayer script={qs[0]?.passage ?? ""} /></div>}
      {skill === "reading" && <div className="card"><p style={{ margin: 0, lineHeight: 1.7 }}>{qs[0]?.passage}</p></div>}
      {(skill === "reading" || skill === "listening") && qs.map((q, n) => (
        <fieldset key={q.id} className="stack" style={{ border: "none", padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 800, color: "var(--color-eel-dark-blue)", marginBottom: 8 }}>{n + 1}. {q.prompt}</legend>
          {q.options?.map((o) => <button key={o} type="button" className="option" aria-pressed={answers[q.id] === o} onClick={() => setAnswers((a) => ({ ...a, [q.id]: o }))}>{o}</button>)}
        </fieldset>
      ))}
      {skill === "writing" && (
        <div className="stack">
          <h2>{qs[0]?.prompt}</h2>
          <textarea className="input" style={{ minHeight: 320 }} value={writing} onChange={(e) => setWriting(e.target.value)} maxLength={12000} aria-label="Your essay" />
          <span className="caption muted">{writing.trim() ? writing.trim().split(/\s+/).length : 0} words</span>
        </div>
      )}
      {skill === "speaking" && (
        <div className="stack">
          <h2>{qs[0]?.prompt}</h2>
          <p className="muted caption">You have one minute to think, then speak for one to two minutes.</p>
          <SpeakingRecorder maxSeconds={150} onChange={setSpeech} />
        </div>
      )}
      {error && <p className="error">{error}</p>}
      <div className="row between">
        <button className="btn btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
        {i < sections.length - 1 ? <button className="btn btn-primary" onClick={() => setI(i + 1)}>Next part</button> : <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? "Submitting…" : "Submit test"}</button>}
      </div>
    </div>
  );
}
