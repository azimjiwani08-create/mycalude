"use client";
import { useState } from "react";
import { api } from "@/components/api";
import { fmtDate } from "@/components/ui";
import { useLoad, type TabProps } from "./common";
import type { Test } from "@/lib/types";

export function TestsTab({ role }: TabProps) {
  const { data, error, reload, setError } = useLoad<{ tests: Test[] }>("/api/admin/tests");
  const [ok, setOk] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try { await api("/api/admin/tests", { method: "POST", body: form }); setOk(true); e.currentTarget.reset(); reload(); } catch (err) { setError((err as Error).message); }
  }
  return (
    <div className="stack" style={{ gap: 24 }}>
      {error && <p className="error">{error}</p>}
      <div className="rows">{data?.tests.map((t) => <div key={t.id} className="row between"><span><strong>{t.title}</strong><br /><span className="caption muted">{t.exam} · {t.duration_min} min · {t.office_id ?? "all offices"}</span></span><span className="pill blue">{t.scheduled_at ? fmtDate(t.scheduled_at, { weekday: "short", day: "numeric", month: "short" }) : "unscheduled"}</span></div>)}</div>
      <form className="card stack" onSubmit={submit}>
        <h3>Schedule a mock test</h3>
        {ok && <div className="notice">Scheduled.</div>}
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
          <div><label>Title</label><input name="title" className="input" required minLength={3} /></div>
          <div><label>Exam</label><select name="exam" className="input">{["ielts_academic", "ielts_general", "ielts_ukvi", "pte", "celpip"].map((x) => <option key={x}>{x}</option>)}</select></div>
          <div><label>Duration (min)</label><input name="duration_min" type="number" className="input" defaultValue={165} min={5} max={240} /></div>
          <div><label>When</label><input name="scheduled_at" type="datetime-local" className="input" required /></div>
          {role === "admin" && <div><label>Office</label><select name="office_id" className="input"><option value="">All offices</option><option value="mumbai">Mumbai</option><option value="vadodara">Vadodara</option></select></div>}
        </div>
        <div><label>Paper or audio file (private)</label><input name="file" type="file" accept=".pdf,audio/*" /></div>
        <button className="btn btn-primary">Schedule</button>
      </form>
    </div>
  );
}
