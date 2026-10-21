"use client";
import { useState } from "react";
import { api } from "@/components/api";
import { fmtDate, fmtTime } from "@/components/ui";
import { useLoad, type TabProps } from "./common";
import type { Attendance, Batch, ClassSession, Homework, HomeworkStatus, Student } from "@/lib/types";

interface Roster { cls: ClassSession; batch: Batch; students: Student[]; attendance: Attendance[]; homework: Homework[]; hwStatus: HomeworkStatus[] }
const ATT = ["present", "late", "absent", "excused"] as const;
const HW = ["submitted", "late", "missing", "assigned"] as const;

export function ClassesTab(_: TabProps) {
  const { data, error } = useLoad<{ classes: (ClassSession & { batch: Batch })[] }>("/api/admin/classes");
  const [id, setId] = useState<string | null>(null);
  return (
    <div className="grid" style={{ gridTemplateColumns: "minmax(240px, 1fr) minmax(300px, 2fr)", alignItems: "start" }}>
      <div className="rows" style={{ maxHeight: 560, overflowY: "auto" }}>
        {error && <p className="error">{error}</p>}
        {data?.classes.map((c) => (
          <button key={c.id} className="option" style={{ border: "none", borderRadius: 0 }} aria-pressed={id === c.id} onClick={() => setId(c.id)}>
            {c.topic}<br /><span className="caption muted">{fmtDate(c.starts_at, { weekday: "short", day: "numeric", month: "short" })} {fmtTime(c.starts_at)} · {c.batch.office_id}</span>
          </button>
        ))}
      </div>
      {id ? <RosterView key={id} classId={id} /> : <p className="muted">Pick a class to mark attendance and homework.</p>}
    </div>
  );
}

function RosterView({ classId }: { classId: string }) {
  const { data, error, reload, setError } = useLoad<Roster>(`/api/admin/classes/${classId}`);
  const [att, setAtt] = useState<Record<string, string>>({});
  const [hwTitle, setHwTitle] = useState("");
  const [hwDue, setHwDue] = useState("");
  const [saved, setSaved] = useState(false);
  if (!data) return error ? <p className="error">{error}</p> : <p className="muted">Loading…</p>;

  const current = (sid: string) => att[sid] ?? data.attendance.find((a) => a.student_id === sid)?.status ?? "";
  const post = async (json: unknown) => { try { await api(`/api/admin/classes/${classId}`, { method: "POST", json }); setSaved(true); reload(); } catch (e) { setError((e as Error).message); } };

  return (
    <div className="stack" style={{ gap: 20 }}>
      <h2 style={{ margin: 0 }}>{data.cls.topic}</h2>
      {error && <p className="error">{error}</p>}
      {saved && <div className="notice">Saved.</div>}
      <div className="rows">
        {data.students.map((s) => (
          <div key={s.id} className="row between">
            <strong>{s.full_name}</strong>
            <span className="row" style={{ gap: 6 }}>
              {ATT.map((a) => <button key={a} className={`btn btn-sm ${current(s.id) === a ? (a === "absent" ? "btn-danger" : "btn-blue") : "btn-ghost"}`} onClick={() => setAtt({ ...att, [s.id]: a })}>{a}</button>)}
            </span>
          </div>
        ))}
      </div>
      <button className="btn btn-primary" onClick={() => post({ action: "attendance", entries: data.students.map((s) => ({ student_id: s.id, status: current(s.id) || "present" })) })}>Save attendance</button>

      <h3>Homework</h3>
      {data.homework.map((h) => (
        <div key={h.id} className="card stack">
          <strong>{h.title}</strong><span className="caption muted">Due {fmtDate(h.due_at)}</span>
          {data.students.map((s) => {
            const st = data.hwStatus.find((x) => x.homework_id === h.id && x.student_id === s.id)?.status ?? "assigned";
            return (
              <div key={s.id} className="row between"><span>{s.full_name}</span>
                <span className="row" style={{ gap: 6 }}>{HW.map((x) => <button key={x} className={`btn btn-sm ${st === x ? "btn-blue" : "btn-ghost"}`} onClick={() => post({ action: "homework_status", homework_id: h.id, entries: [{ student_id: s.id, status: x }] })}>{x === "assigned" ? "to do" : x}</button>)}</span>
              </div>
            );
          })}
        </div>
      ))}
      <form className="row" onSubmit={(e) => { e.preventDefault(); post({ action: "add_homework", title: hwTitle, due_at: hwDue }); setHwTitle(""); }}>
        <input className="input" style={{ flex: 2 }} placeholder="New homework title" value={hwTitle} onChange={(e) => setHwTitle(e.target.value)} required minLength={3} />
        <input className="input" style={{ flex: 1 }} type="datetime-local" value={hwDue} onChange={(e) => setHwDue(e.target.value)} required />
        <button className="btn btn-lime btn-sm">Add</button>
      </form>
    </div>
  );
}
