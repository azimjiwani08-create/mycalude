"use client";
import { useState } from "react";
import { api } from "@/components/api";
import { Band, SKILL_LABEL, fmtDate, statusPill } from "@/components/ui";
import { useLoad, type TabProps } from "./common";
import type { Question, Score, Student, Submission } from "@/lib/types";

interface Item { submission: Submission; student: Student; score: Score | null; question: Question | null; audio_url: string | null }

export function ReviewTab(_: TabProps) {
  const { data, error, reload, setError } = useLoad<{ queue: Item[] }>("/api/admin/review");
  return (
    <div className="stack" style={{ gap: 20 }}>
      {error && <p className="error">{error}</p>}
      {data?.queue.length === 0 && <p className="muted">Nothing waiting for review. 🎉</p>}
      {data?.queue.map((it) => <ReviewCard key={it.submission.id} item={it} onDone={reload} onError={setError} />)}
    </div>
  );
}

function ReviewCard({ item, onDone, onError }: { item: Item; onDone: () => void; onError: (m: string) => void }) {
  const { submission: s, student, score, question } = item;
  const est = score?.ai_estimate;
  const [band, setBand] = useState(String(score?.ai_band ?? ""));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try { await api(`/api/admin/review/${s.id}`, { method: "POST", json: { final_band: Number(band), note: note || null, release: true } }); onDone(); }
    catch (e) { onError((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="card stack">
      <div className="row between">
        <span><strong>{student.full_name}</strong> · {SKILL_LABEL[s.skill]} · {s.kind}<br /><span className="caption muted">{fmtDate(s.created_at)} · {student.office_id}</span></span>
        {statusPill(s.status)}
      </div>
      {question && <p className="muted" style={{ margin: 0 }}><em>{question.prompt}</em></p>}
      {item.audio_url && <audio controls src={item.audio_url} />}
      <div className="card" style={{ background: "var(--color-polar)" }}><p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{s.skill === "speaking" ? s.transcript ?? s.body_text ?? "(no transcript)" : s.body_text}</p></div>
      {est ? (
        <>
          <div className="row"><Band value={est.band} estimate label="AI estimate" /><span className="muted caption">{est.feedback}</span></div>
          <div className="rows">{est.criteria.map((c) => <div key={c.name} className="row between" style={{ flexWrap: "nowrap" }}><span><strong>{c.name}</strong> — <span className="muted">{c.reason}</span></span><span className="pill amber">{c.band.toFixed(1)}</span></div>)}</div>
        </>
      ) : <div className="notice warn">The AI couldn&apos;t produce a valid score. Please mark this by hand.</div>}
      <div className="row">
        <label htmlFor={`band-${s.id}`} style={{ margin: 0 }}>Final band</label>
        <select id={`band-${s.id}`} className="input" style={{ width: 110 }} value={band} onChange={(e) => setBand(e.target.value)}>
          <option value="">–</option>
          {Array.from({ length: 19 }, (_, i) => i * 0.5).map((b) => <option key={b} value={b}>{b.toFixed(1)}</option>)}
        </select>
        <input className="input" style={{ flex: 1, minWidth: 200 }} placeholder="Note for the student (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        <button className="btn btn-primary btn-sm" disabled={busy || band === ""} onClick={save}>{Number(band) === score?.ai_band ? "Accept & release" : "Override & release"}</button>
      </div>
      <p className="caption muted">Both the AI estimate and your final band are stored.</p>
    </div>
  );
}
