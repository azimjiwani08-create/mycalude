import type { Metadata } from "next";
import Link from "next/link";
import { requirePageRole } from "@/lib/page-auth";
import { withPageDb } from "@/lib/pipeline";
import { getPortal } from "@/lib/services/portal";
import { Band, Empty, Progress, SKILL_LABEL, fmtDate, fmtTime, statusPill } from "@/components/ui";
import { PracticePanel } from "./practice";
import { ConsentControls } from "./consent";

export const metadata: Metadata = { title: "My portal" };
export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const user = await requirePageRole(["student"]);
  const { p, mocks } = await withPageDb(async (db) => ({ p: await getPortal(db, user.student_id!), mocks: await db.select("tests", { kind: "mock" }) }));
  const gap = p.current_band !== null && p.target_band !== null ? Math.max(0, p.target_band - p.current_band) : null;
  const todo = p.homework.filter((h) => h.status === "assigned");

  return (
    <div className="container section stack" style={{ gap: 40 }}>
      <div className="row between">
        <h1 className="display" style={{ fontSize: 40, margin: 0 }}>Hi {p.student.full_name.split(" ")[0]}!</h1>
        {p.batches.map((b) => <span key={b.id} className="pill blue">{b.course?.name} · {b.schedule}</span>)}
      </div>

      <section className="card lime stack">
        <div className="row between">
          <h2 style={{ margin: 0 }}>Band gap</h2>
          <span className="muted caption">Target {p.target_band?.toFixed(1) ?? "not set"}</span>
        </div>
        <div className="row" style={{ gap: 20 }}>
          <Band value={p.current_band} estimate={p.results.some((r) => r.score && r.skill !== "objective" && !r.score.teacher_reviewed)} label="current" />
          <div style={{ flex: 1, minWidth: 200 }}>
            <Progress value={p.current_band ?? 0} max={p.target_band ?? 9} />
            <p style={{ margin: "8px 0 0" }}>{gap === null ? "Take a mock test to measure your band." : gap === 0 ? "You're at your target — keep it steady!" : <><strong>{gap.toFixed(1)}</strong> band{gap === 1 ? "" : "s"} to go.</>}</p>
          </div>
        </div>
        <div className="row">
          {Object.entries(p.bands).map(([s, b]) => <span key={s} className="pill">{SKILL_LABEL[s]} {Number(b).toFixed(1)}</span>)}
        </div>
      </section>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", alignItems: "start" }}>
        <section className="stack">
          <h2>Today&apos;s classes</h2>
          {p.today.length ? (
            <div className="rows">{p.today.map((c) => <div key={c.id} className="row between"><span><strong>{c.topic}</strong></span><span className="pill blue">{fmtTime(c.starts_at)}</span></div>)}</div>
          ) : <Empty>No class today.{p.upcoming[0] ? ` Next: ${p.upcoming[0].topic}, ${fmtDate(p.upcoming[0].starts_at, { weekday: "short", day: "numeric", month: "short" })}.` : ""}</Empty>}

          <h2 style={{ marginTop: 16 }}>Homework</h2>
          {p.homework.length ? (
            <div className="rows">{p.homework.slice(0, 6).map((h) => <div key={h.id} className="row between"><span>{h.title}<br /><span className="caption muted">Due {fmtDate(h.due_at)}</span></span>{statusPill(h.status)}</div>)}</div>
          ) : <Empty>No homework yet.</Empty>}
          {todo.length > 0 && <p className="caption muted">{todo.length} to do</p>}
        </section>

        <section className="stack">
          <h2>Attendance</h2>
          <div className="card">
            <p style={{ fontSize: 28, fontWeight: 900, margin: 0, color: "var(--color-eel-dark-blue)" }}>{p.attendance.present}/{p.attendance.total}</p>
            <p className="muted" style={{ margin: "0 0 8px" }}>classes attended</p>
            <Progress value={p.attendance.present} max={p.attendance.total || 1} blue />
          </div>
          <h2 style={{ marginTop: 16 }}>Mock tests</h2>
          <div className="rows">
            {mocks.map((t) => <div key={t.id} className="row between"><span><strong>{t.title}</strong><br /><span className="caption muted">{t.duration_min} minutes, exam timing</span></span><Link className="btn btn-primary btn-sm" href={`/portal/mock/${t.id}`}>Start</Link></div>)}
          </div>
        </section>
      </div>

      <section className="stack">
        <h2>My results</h2>
        {p.results.length ? (
          <div className="rows">
            {p.results.map((r) => (
              <div key={r.id} className="row between">
                <span><strong>{r.test}</strong> · {SKILL_LABEL[r.skill] ?? r.skill}<br /><span className="caption muted">{fmtDate(r.created_at)}</span></span>
                <span className="row">
                  {r.score ? <Band value={r.score.final_band ?? r.score.ai_band} estimate={!r.score.teacher_reviewed && r.skill !== "objective"} /> : statusPill(r.status)}
                  {r.score && <Link href={`/portal/results/${r.id}`} className="btn btn-ghost btn-sm">Details</Link>}
                </span>
              </div>
            ))}
          </div>
        ) : <Empty>No results yet. Try a mock test or practice below.</Empty>}
      </section>

      <PracticePanel />

      <section className="stack">
        <h2>Weekly reports</h2>
        {p.reports.length ? p.reports.map((r) => (
          <div key={r.id} className="card"><p className="caption muted upper">Week of {fmtDate(r.week_start, { day: "numeric", month: "long" })}</p><p style={{ margin: 0 }}>{r.body_text}</p></div>
        )) : <Empty>Your first weekly report arrives after your teacher approves it.</Empty>}
      </section>

      <ConsentControls hasParent={p.has_parent} parentShare={p.consents.some((c) => c.kind === "parent_share")} minorSigned={p.consents.some((c) => c.kind === "parent_signed_minor")} keepAudio={p.consents.some((c) => c.kind === "audio_retention")} />
    </div>
  );
}
