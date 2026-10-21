"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/components/api";
import { Band, Progress, SKILL_LABEL } from "@/components/ui";
import { ListenPlayer } from "@/components/ListenPlayer";
import { SpeakingRecorder } from "@/components/SpeakingRecorder";
import { Timer } from "@/components/Timer";
import { Towie } from "@/components/Illustrations";
import type { CriterionScore, Diagnostic, PublicQuestion, Skill } from "@/lib/types";

const GOALS: [string, string][] = [
  ["ielts_academic", "IELTS Academic — study abroad"],
  ["ielts_general", "IELTS General — work or migration"],
  ["ielts_ukvi", "IELTS for UKVI — UK visa"],
  ["pte", "PTE Academic"],
  ["celpip", "CELPIP — Canada"],
  ["english", "Better everyday English"],
];
const STEPS: Skill[] = ["reading", "listening", "writing", "speaking"];

interface Result {
  diagnostic: Diagnostic;
  objective: Record<"reading" | "listening", { raw: number; max: number }>;
  criteria: Record<"writing" | "speaking", CriterionScore[]>;
  feedback: Record<"writing" | "speaking", string>;
}

export function DiagnosticRunner() {
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [goal, setGoal] = useState("ielts_academic");
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [writing, setWriting] = useState("");
  const [speaking, setSpeaking] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ questions: PublicQuestion[] }>("/api/diagnostic").then((d) => setQuestions(d.questions)).catch((e) => setError(e.message));
  }, []);

  const bySkill = useMemo(() => Object.fromEntries(STEPS.map((s) => [s, questions.filter((q) => q.skill === s)])) as Record<Skill, PublicQuestion[]>, [questions]);
  const words = writing.trim() ? writing.trim().split(/\s+/).length : 0;

  const submit = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await api<Result>("/api/diagnostic", { method: "POST", json: { goal, answers, writing, speaking } }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [busy, goal, answers, writing, speaking]);

  if (result) return <ResultView result={result} />;

  if (step === -1) {
    return (
      <div className="stack" style={{ gap: 24 }}>
        <div className="row"><Towie size={72} wave /><h1 className="display" style={{ fontSize: 40 }}>Free English diagnostic</h1></div>
        <p style={{ fontSize: 17 }}>Fifteen minutes, four short parts: reading, listening, writing and speaking. You get a band estimate, your weakest skill and a course suggestion straight away.</p>
        <div className="field">
          <label htmlFor="goal">What are you preparing for?</label>
          <select id="goal" className="input" value={goal} onChange={(e) => setGoal(e.target.value)}>
            {GOALS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <p className="muted caption">We don&apos;t ask for your name or number here. Your speaking answer is turned into text in your browser; no recording is uploaded for the diagnostic.</p>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={!questions.length} onClick={() => setStep(0)}>Start — 15 minutes</button>
      </div>
    );
  }

  const skill = STEPS[step];
  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="row between">
        <span className="pill blue">{step + 1} / 4 · {SKILL_LABEL[skill]}</span>
        <Timer minutes={15} onExpire={submit} />
      </div>
      <Progress value={step + 1} max={4} />

      {(skill === "reading" || skill === "listening") && (
        <div className="stack" style={{ gap: 16 }}>
          {skill === "reading" ? (
            <div className="card"><p style={{ margin: 0, lineHeight: 1.7 }}>{bySkill.reading[0]?.passage}</p></div>
          ) : (
            <div className="card blue stack"><p style={{ margin: 0 }}>Listen to the announcement, then answer.</p><ListenPlayer script={bySkill.listening[0]?.passage ?? ""} /></div>
          )}
          {bySkill[skill].map((q, i) => (
            <fieldset key={q.id} className="stack" style={{ border: "none", padding: 0, margin: 0 }}>
              <legend style={{ fontWeight: 800, color: "var(--color-eel-dark-blue)", marginBottom: 8 }}>{i + 1}. {q.prompt}</legend>
              {q.options?.map((o) => (
                <button key={o} type="button" className="option" aria-pressed={answers[q.id] === o} onClick={() => setAnswers((a) => ({ ...a, [q.id]: o }))}>{o}</button>
              ))}
            </fieldset>
          ))}
        </div>
      )}

      {skill === "writing" && (
        <div className="stack">
          <h2>{bySkill.writing[0]?.prompt}</h2>
          <textarea className="input" value={writing} onChange={(e) => setWriting(e.target.value)} maxLength={5000} aria-label="Your answer" />
          <span className={`caption ${words >= 80 ? "" : "muted"}`}>{words} words {words < 80 ? "· aim for 80+" : "✓"}</span>
        </div>
      )}

      {skill === "speaking" && (
        <div className="stack">
          <h2>{bySkill.speaking[0]?.prompt}</h2>
          <SpeakingRecorder maxSeconds={90} allowAudio={false} onChange={(v) => setSpeaking(v.transcript)} />
        </div>
      )}

      {error && <p className="error">{error}</p>}
      <div className="row between">
        <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>Back</button>
        {step < 3 ? (
          <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>Continue</button>
        ) : (
          <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? "Scoring…" : "See my result"}</button>
        )}
      </div>
    </div>
  );
}

function ResultView({ result }: { result: Result }) {
  const d = result.diagnostic;
  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="row"><Towie size={72} wave /><h1 className="display" style={{ fontSize: 40 }}>Your starting point</h1></div>
      <div className="row" style={{ gap: 20 }}>
        <Band value={d.band_estimate} estimate />
        <div>
          <p style={{ margin: 0, fontSize: 17 }}>Overall band <strong>estimate</strong></p>
          <p className="muted" style={{ margin: 0 }}>Weakest skill: <strong>{SKILL_LABEL[d.weakest_skill]}</strong></p>
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
        {(Object.keys(d.skill_bands) as Skill[]).map((s) => (
          <div key={s} className={`card ${s === d.weakest_skill ? "blue" : ""}`}>
            <p className="upper caption muted" style={{ margin: 0 }}>{SKILL_LABEL[s]}</p>
            <p style={{ fontSize: 28, fontWeight: 900, margin: 0, color: "var(--color-eel-dark-blue)" }}>{d.skill_bands[s].toFixed(1)}</p>
            {(s === "reading" || s === "listening") && <p className="caption muted" style={{ margin: 0 }}>{result.objective[s].raw}/{result.objective[s].max} correct</p>}
          </div>
        ))}
      </div>
      {(["writing", "speaking"] as const).map((s) => (
        <div key={s} className="card">
          <h3>{SKILL_LABEL[s]} — why this estimate</h3>
          <div className="rows" style={{ marginBottom: 12 }}>
            {result.criteria[s].map((c) => (
              <div key={c.name} className="row between" style={{ flexWrap: "nowrap" }}>
                <span><strong>{c.name}</strong><br /><span className="muted">{c.reason}</span></span>
                <span className="pill amber">{c.band.toFixed(1)}</span>
              </div>
            ))}
          </div>
          <p className="muted" style={{ margin: 0 }}>{result.feedback[s]}</p>
        </div>
      ))}
      <div className="notice">
        Suggested course: <strong>{d.suggested_course?.replace(/-/g, " ")}</strong>. Your result is saved — when you book, we attach it so you won&apos;t need to repeat anything.
      </div>
      <div className="stack" style={{ maxWidth: 360 }}>
        <Link className="btn btn-primary" href={`/courses?course=${d.suggested_course}&diagnostic=${d.id}`}>Book a seat</Link>
        <Link className="btn btn-ghost" href="/ask">Ask a question first</Link>
      </div>
      <p className="caption muted">All scores here are AI estimates from a short test. Your teacher confirms real scores on full mock tests.</p>
    </div>
  );
}
