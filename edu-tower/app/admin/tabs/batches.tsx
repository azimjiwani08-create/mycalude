"use client";
import { useState } from "react";
import { api } from "@/components/api";
import { fmtDate, statusPill } from "@/components/ui";
import { useLoad, type TabProps } from "./common";
import type { BatchWithSeats, Course, Student } from "@/lib/types";

type B = BatchWithSeats & { students: Student[] };

export function BatchesTab({ role }: TabProps) {
  const { data, error, reload, setError } = useLoad<{ batches: B[]; courses: Course[] }>("/api/admin/batches");
  const canEdit = role !== "teacher";
  const [form, setForm] = useState({ course_id: "ielts-academic", office_id: "mumbai", start_date: "", schedule: "Mon–Fri · 7:00–9:00 pm", seats: 12 });
  const [move, setMove] = useState<{ student_id: string; from_batch: string; to_batch: string } | null>(null);

  const run = async (fn: () => Promise<unknown>) => { try { await fn(); reload(); } catch (e) { setError((e as Error).message); } };
  const name = (id: string) => data?.courses.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="stack" style={{ gap: 24 }}>
      {error && <p className="error">{error}</p>}
      <div className="scroll-x">
        <table className="table">
          <thead><tr><th>Batch</th><th>Office</th><th>Starts</th><th>Seats</th><th>Students</th><th>Status</th>{canEdit && <th></th>}</tr></thead>
          <tbody>
            {data?.batches.map((b) => (
              <tr key={b.id}>
                <td><strong>{name(b.course_id)}</strong><br /><span className="caption muted">{b.schedule}</span></td>
                <td>{b.office_id}</td>
                <td>{fmtDate(b.start_date)}</td>
                <td>{canEdit ? <input className="input" style={{ width: 80, minHeight: 36, padding: 6 }} type="number" min={1} defaultValue={b.seats} onBlur={(e) => Number(e.target.value) !== b.seats && run(() => api(`/api/admin/batches/${b.id}`, { method: "PATCH", json: { seats: Number(e.target.value) } }))} aria-label="Seats" /> : b.seats}<br /><span className="caption muted">{b.seats_left} left</span></td>
                <td className="caption">{b.students.map((s) => (
                  <div key={s.id} className="row" style={{ gap: 4 }}>{s.full_name}{canEdit && <button className="pill" style={{ cursor: "pointer" }} onClick={() => setMove({ student_id: s.id, from_batch: b.id, to_batch: "" })}>move</button>}</div>
                ))}</td>
                <td>{statusPill(b.status)}</td>
                {canEdit && <td><button className="btn btn-ghost btn-sm" onClick={() => run(() => api(`/api/admin/batches/${b.id}`, { method: "PATCH", json: { status: b.status === "open" ? "closed" : "open" } }))}>{b.status === "open" ? "Close" : "Reopen"}</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {move && (
        <div className="card blue stack">
          <h3>Move student</h3>
          <select className="input" value={move.to_batch} onChange={(e) => setMove({ ...move, to_batch: e.target.value })}>
            <option value="">Choose a batch…</option>
            {data?.batches.filter((b) => b.id !== move.from_batch && b.status === "open").map((b) => <option key={b.id} value={b.id}>{name(b.course_id)} · {b.office_id} · {fmtDate(b.start_date)} ({b.seats_left} left)</option>)}
          </select>
          <div className="row">
            <button className="btn btn-primary btn-sm" disabled={!move.to_batch} onClick={() => run(async () => { await api("/api/admin/batches/move", { method: "POST", json: move }); setMove(null); })}>Move</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setMove(null)}>Cancel</button>
          </div>
        </div>
      )}

      {canEdit && (
        <form className="card stack" onSubmit={(e) => { e.preventDefault(); run(() => api("/api/admin/batches", { method: "POST", json: form })); }}>
          <h3>New batch</h3>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
            <div><label>Course</label><select className="input" value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}>{data?.courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label>Office</label><select className="input" value={form.office_id} onChange={(e) => setForm({ ...form, office_id: e.target.value })}><option value="mumbai">Mumbai</option><option value="vadodara">Vadodara</option></select></div>
            <div><label>Start date</label><input className="input" type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><label>Seats</label><input className="input" type="number" min={1} max={60} value={form.seats} onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })} /></div>
          </div>
          <div><label>Schedule</label><input className="input" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} /></div>
          <button className="btn btn-primary">Create batch</button>
          {role !== "admin" && <p className="caption muted">You can only create batches for your own office.</p>}
        </form>
      )}
    </div>
  );
}
