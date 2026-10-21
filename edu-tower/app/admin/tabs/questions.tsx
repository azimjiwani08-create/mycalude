"use client";
import { useState } from "react";
import { api } from "@/components/api";
import { SKILL_LABEL } from "@/components/ui";
import { useLoad, type TabProps } from "./common";
import type { Question } from "@/lib/types";

export function QuestionsTab({ live }: TabProps) {
  const { data, error, reload, setError } = useLoad<{ pending: Question[]; bank: (Omit<Question, "answer_key"> & { has_key: boolean })[] }>("/api/admin/questions");
  const [skill, setSkill] = useState("writing");
  const [level, setLevel] = useState("band 6");
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>) => { setBusy(true); try { await fn(); reload(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } };

  return (
    <div className="stack" style={{ gap: 24 }}>
      {error && <p className="error">{error}</p>}
      <div className="card blue stack">
        <h3>Generate practice questions</h3>
        <p className="muted caption" style={{ margin: 0 }}>{live ? "Generated with OpenAI." : "Demo mode: drawn from a sample pool."} New questions wait here until a teacher approves them.</p>
        <div className="row">
          <select className="input" style={{ width: 160 }} value={skill} onChange={(e) => setSkill(e.target.value)}>{["writing", "speaking", "reading", "listening"].map((s) => <option key={s} value={s}>{SKILL_LABEL[s]}</option>)}</select>
          <select className="input" style={{ width: 140 }} value={level} onChange={(e) => setLevel(e.target.value)}>{["band 5", "band 6", "band 6.5", "band 7", "band 8"].map((l) => <option key={l}>{l}</option>)}</select>
          <button className="btn btn-blue btn-sm" disabled={busy} onClick={() => run(() => api("/api/admin/questions", { method: "POST", json: { skill, level, count: 3 } }))}>Generate 3</button>
        </div>
      </div>

      <h3>Waiting for review ({data?.pending.length ?? 0})</h3>
      {data?.pending.map((q) => (
        <div key={q.id} className="card stack">
          <div className="row"><span className="pill amber">AI generated</span><span className="pill">{SKILL_LABEL[q.skill]}</span><span className="pill">{q.level}</span></div>
          {q.passage && <p className="muted" style={{ margin: 0 }}>{q.passage}</p>}
          <strong>{q.prompt}</strong>
          {q.options && <ul style={{ margin: 0 }}>{q.options.map((o) => <li key={o}>{o}{o === q.answer_key ? " ✓" : ""}</li>)}</ul>}
          <div className="row">
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => run(() => api(`/api/admin/questions/${q.id}`, { method: "POST", json: { approve: true } }))}>Approve to bank</button>
            <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => run(() => api(`/api/admin/questions/${q.id}`, { method: "POST", json: { approve: false } }))}>Reject</button>
          </div>
        </div>
      ))}

      <h3>Shared bank ({data?.bank.length ?? 0})</h3>
      <div className="rows">{data?.bank.map((q) => <div key={q.id}><span className="pill">{SKILL_LABEL[q.skill]}</span> <span className="pill">{q.level}</span> {q.source === "ai_generated" && <span className="pill amber">AI · reviewed</span>} <span>{q.prompt}</span></div>)}</div>
    </div>
  );
}
