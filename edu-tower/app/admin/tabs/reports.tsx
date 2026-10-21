"use client";
import { useState } from "react";
import { api } from "@/components/api";
import { fmtDate, statusPill } from "@/components/ui";
import { useLoad, type TabProps } from "./common";
import type { Report, Student } from "@/lib/types";

export function ReportsTab(_: TabProps) {
  const { data, error, reload, setError } = useLoad<{ reports: { report: Report; student: Student }[] }>("/api/admin/reports");
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try { const r = await api<{ created: number; weekStart: string }>("/api/admin/reports", { method: "POST", json: {} }); setFlash(`${r.created} drafts ready for the week of ${r.weekStart}.`); reload(); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="row between">
        <p className="muted" style={{ margin: 0 }}>Drafts are written every Sunday evening. Numbers come straight from attendance, homework and scores; the wording is checked before it goes out.</p>
        <button className="btn btn-blue btn-sm" disabled={busy} onClick={generate}>Draft this week now</button>
      </div>
      {flash && <div className="notice">{flash}</div>}
      {error && <p className="error">{error}</p>}
      {data?.reports.length === 0 && <p className="muted">No reports yet.</p>}
      {data?.reports.map(({ report, student }) => <ReportCard key={report.id} report={report} student={student} onDone={(m) => { setFlash(m); reload(); }} onError={setError} />)}
    </div>
  );
}

function ReportCard({ report, student, onDone, onError }: { report: Report; student: Student; onDone: (m: string) => void; onError: (m: string) => void }) {
  const [text, setText] = useState(report.body_text);
  const [busy, setBusy] = useState(false);
  const d = report.data;
  async function approve() {
    setBusy(true);
    try {
      const r = await api<{ delivery: { student: string; parents: { name: string; sent: boolean; reason?: string }[] } }>(`/api/admin/reports/${report.id}`, { method: "POST", json: { body_text: text } });
      const parents = r.delivery.parents.map((p) => (p.sent ? `${p.name}: sent` : `${p.name}: not sent (${p.reason})`)).join("; ");
      onDone(`${student.full_name}: sent to student (${r.delivery.student}).${parents ? ` Parents — ${parents}.` : " No parent linked."}`);
    } catch (e) { onError((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="card stack">
      <div className="row between"><span><strong>{student.full_name}</strong> · week of {fmtDate(report.week_start)} · {student.office_id}</span>{statusPill(report.status)}</div>
      <div className="row caption">
        <span className="pill">Attendance {d.attendance_present}/{d.attendance_total}</span>
        <span className="pill">Homework {d.homework_done}/{d.homework_total}</span>
        {d.mocks.map((m) => <span key={m.title} className={`pill ${m.is_estimate ? "amber" : "green"}`}>{m.title}: {m.band.toFixed(1)}{m.is_estimate ? " est." : ""}</span>)}
        <span className="pill blue">Next focus: {d.next_focus}</span>
      </div>
      {report.status === "draft" ? (
        <>
          <textarea className="input" style={{ minHeight: 110 }} value={text} onChange={(e) => setText(e.target.value)} maxLength={3000} aria-label="Report text" />
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={approve}>Approve &amp; send</button>
        </>
      ) : <p style={{ margin: 0 }}>{report.body_text}</p>}
    </div>
  );
}
