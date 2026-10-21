"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/components/api";
import { Band, SKILL_LABEL, statusPill } from "@/components/ui";
import { SpeakingRecorder } from "@/components/SpeakingRecorder";
import type { AiEstimate, PublicQuestion } from "@/lib/types";

interface View { submission: { status: string }; score: { ai_estimate: AiEstimate | null; ai_band: number | null; final_band: number | null; teacher_reviewed: boolean } | null }

export function PracticePanel() {
  const router = useRouter();
  const [data, setData] = useState<{ weakest: string; questions: PublicQuestion[] } | null>(null);
  const [qid, setQid] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [audio, setAudio] = useState<Blob | null>(null);
  const [subId, setSubId] = useState<string | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api<{ weakest: string; questions: PublicQuestion[] }>("/api/practice").then((d) => { setData(d); setQid(d.questions[0]?.id ?? null); }).catch((e) => setError(e.message)); }, []);
  const q = data?.questions.find((x) => x.id === qid);

  useEffect(() => {
    if (!subId) return;
    let stop = false;
    const poll = async () => {
      const v = await api<View>(`/api/submissions/${subId}`).catch(() => null);
      if (stop || !v) return;
      setView(v);
      if (v.submission.status === "released" || v.submission.status === "needs_teacher") { router.refresh(); return; }
      setTimeout(poll, 2000);
    };
    poll();
    return () => { stop = true; };
  }, [subId, router]);

  async function submit() {
    if (!q) return;
    setBusy(true); setError(null); setView(null);
    try {
      const form = new FormData();
      form.set("kind", "practice");
      form.set("question_id", q.id);
      form.set("skill", q.skill);
      if (text) form.set("body_text", text);
      if (audio && audio.size) form.set("audio", new File([audio], "answer.webm", { type: audio.type.split(";")[0] || "audio/webm" }));
      const r = await api<{ id: string }>("/api/submissions", { method: "POST", body: form });
      setSubId(r.id);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  if (!data) return null;
  const est = view?.score?.ai_estimate;
  return (
    <section className="card blue stack">
      <div className="row between">
        <h2 style={{ margin: 0 }}>Practice</h2>
        <span className="pill amber">Your weakest skill: {SKILL_LABEL[data.weakest]}</span>
      </div>
      <select className="input" value={qid ?? ""} onChange={(e) => { setQid(e.target.value); setText(""); setAudio(null); setSubId(null); setView(null); }} aria-label="Choose a practice task">
        {data.questions.map((x) => <option key={x.id} value={x.id}>{SKILL_LABEL[x.skill]} · {x.prompt.slice(0, 80)}</option>)}
      </select>
      {q && <p style={{ fontWeight: 700, color: "var(--color-eel-dark-blue)" }}>{q.prompt}</p>}
      {q?.skill === "writing" && <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} maxLength={12000} aria-label="Your answer" />}
      {q?.skill === "speaking" && <SpeakingRecorder onChange={(v) => { setAudio(v.audio); setText(v.transcript); }} />}
      {error && <p className="error">{error}</p>}
      <button className="btn btn-primary" onClick={submit} disabled={busy || (!text.trim() && !audio)}>{busy ? "Sending…" : "Get feedback"}</button>

      {view && !view.score && <div className="row">{statusPill(view.submission.status)}<span className="muted">{view.submission.status === "needs_teacher" ? "Your teacher will mark this one by hand." : "Marking against the band rubric…"}</span></div>}
      {est && (
        <div className="stack">
          <div className="row"><Band value={view!.score!.final_band ?? est.band} estimate={!view!.score!.teacher_reviewed} /><span className="muted">AI estimate. Your teacher can adjust it.</span></div>
          <div className="rows">{est.criteria.map((c) => <div key={c.name} className="row between" style={{ flexWrap: "nowrap" }}><span><strong>{c.name}</strong><br /><span className="muted">{c.reason}</span></span><span className="pill amber">{c.band.toFixed(1)}</span></div>)}</div>
          <p>{est.feedback}</p>
          <details><summary style={{ cursor: "pointer", fontWeight: 800 }}>Corrected sample</summary><p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{est.corrected_sample}</p></details>
        </div>
      )}
    </section>
  );
}
