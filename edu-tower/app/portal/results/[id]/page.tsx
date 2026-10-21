import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageRole } from "@/lib/page-auth";
import { withPageDb } from "@/lib/pipeline";
import { canSeeStudent } from "@/lib/access";
import { getSubmissionForViewer } from "@/lib/services/submissions";
import { Band, SKILL_LABEL, fmtDate, statusPill } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageRole(["student", "parent"]);
  const view = await withPageDb(async (db) => {
    const v = await getSubmissionForViewer(db, id).catch(() => null);
    if (!v?.submission.student_id || !(await canSeeStudent(db, user, v.submission.student_id))) return null;
    return v;
  });
  if (!view) notFound();
  const { submission: s, score } = view;
  const est = score?.ai_estimate;

  return (
    <div className="container section stack" style={{ maxWidth: 760, gap: 24 }}>
      <Link href={user.role === "parent" ? "/parent" : "/portal"}>← Back</Link>
      <h1>{SKILL_LABEL[s.skill] ?? s.skill} · {s.kind === "mock" ? "Mock test" : "Practice"}</h1>
      <p className="muted">{fmtDate(s.created_at, { day: "numeric", month: "long" })}</p>
      {!score ? statusPill(s.status) : (
        <>
          <div className="row" style={{ gap: 20 }}>
            {score.final_band !== null && <Band value={score.final_band} estimate={!score.teacher_reviewed && s.skill !== "objective"} label={score.teacher_reviewed ? "teacher" : s.skill === "objective" ? "marked" : "estimate"} />}
            {score.ai_band !== null && score.teacher_reviewed && <Band value={score.ai_band} estimate label="AI estimate" />}
            {score.final_band === null && <Band value={score.ai_band} estimate />}
            {score.objective_max !== null && <span className="pill blue">{score.objective_raw}/{score.objective_max} correct</span>}
          </div>
          {score.final_note && <div className="notice">Teacher&apos;s note: {score.final_note}</div>}
          {est && (
            <>
              <h2>Rubric</h2>
              <div className="rows">{est.criteria.map((c) => <div key={c.name} className="row between" style={{ flexWrap: "nowrap" }}><span><strong>{c.name}</strong><br /><span className="muted">{c.reason}</span></span><span className="pill amber">{c.band.toFixed(1)}</span></div>)}</div>
              <h2>Feedback</h2>
              <p>{est.feedback}</p>
              <h2>Corrected sample</h2>
              <div className="card"><p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{est.corrected_sample}</p></div>
            </>
          )}
          {s.transcript && <><h2>Transcript</h2><p className="muted" style={{ whiteSpace: "pre-wrap" }}>{s.transcript}</p></>}
          <p className="caption muted">AI scores are estimates. Your teacher reviews mock test writing and speaking and can change any score; both are kept on your record.</p>
        </>
      )}
    </div>
  );
}
