import type { Metadata } from "next";
import { requirePageRole } from "@/lib/page-auth";
import { withPageDb } from "@/lib/pipeline";
import { isAdult, parentCanSee } from "@/lib/access";
import { latestBands } from "@/lib/services/reports";
import { SKILL_LABEL, fmtDate } from "@/components/ui";

export const metadata: Metadata = { title: "Parent digest" };
export const dynamic = "force-dynamic";

/** Parents see the same data as the weekly report, only for consented children. */
export default async function ParentPage() {
  const user = await requirePageRole(["parent"]);
  const children = await withPageDb(async (db) => {
    const links = await db.select("parent_links", { parent_id: user.parent_id! });
    return Promise.all(
      links.map(async (l) => {
        const [student] = await db.select("students", { id: l.student_id });
        const allowed = await parentCanSee(db, user.parent_id!, student);
        if (!allowed) return { name: student.full_name.split(" ")[0], allowed: false as const, minor: !isAdult(student.date_of_birth) };
        const reports = (await db.select("reports", { student_id: student.id, status: "sent" }, { order: { column: "week_start", ascending: false } }));
        return { name: student.full_name, allowed: true as const, reports, bands: await latestBands(db, student.id), target: student.target_band };
      }),
    );
  });

  return (
    <div className="container section stack" style={{ maxWidth: 760, gap: 28 }}>
      <h1 className="display" style={{ fontSize: 40 }}>Weekly digest</h1>
      {children.map((c, i) => c.allowed ? (
        <section key={i} className="stack">
          <h2>{c.name}</h2>
          <div className="row">
            {Object.entries(c.bands).map(([s, b]) => <span key={s} className="pill">{SKILL_LABEL[s]} {Number(b).toFixed(1)}</span>)}
            {c.target && <span className="pill green">Target {c.target.toFixed(1)}</span>}
          </div>
          {c.reports.length ? c.reports.map((r) => (
            <div key={r.id} className="card"><p className="caption muted upper">Week of {fmtDate(r.week_start, { day: "numeric", month: "long" })}</p><p style={{ margin: 0 }}>{r.body_text}</p></div>
          )) : <p className="muted">No report has been sent yet this term.</p>}
        </section>
      ) : (
        <div key={i} className="notice warn">
          <strong>{c.name}&apos;s</strong> progress isn&apos;t shared with you yet. {c.minor ? "For students under 18 we need both your child's agreement in their portal and a parent consent form signed at the office." : "Your child can turn on sharing from their student portal."}
        </div>
      ))}
    </div>
  );
}
