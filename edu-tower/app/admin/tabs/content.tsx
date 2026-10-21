"use client";
import { useState } from "react";
import { api } from "@/components/api";
import { useLoad, type TabProps } from "./common";
import type { ContentEntry, Course } from "@/lib/types";

const blank = { kind: "faq" as ContentEntry["kind"], title: "", body: "", tags: "", approved: true };

export function ContentTab(_: TabProps) {
  const { data, error, reload, setError } = useLoad<{ entries: ContentEntry[]; courses: Course[] }>("/api/admin/content");
  const [edit, setEdit] = useState<(typeof blank & { id?: string }) | null>(null);
  const run = async (fn: () => Promise<unknown>) => { try { await fn(); reload(); } catch (e) { setError((e as Error).message); } };

  return (
    <div className="stack" style={{ gap: 24 }}>
      {error && <p className="error">{error}</p>}
      <p className="muted">Only <strong>approved</strong> entries feed the Ask helper. Changes take effect immediately — no code change.</p>
      <div className="row"><button className="btn btn-blue btn-sm" onClick={() => setEdit({ ...blank })}>New entry</button></div>
      {edit && (
        <form className="card blue stack" onSubmit={(e) => { e.preventDefault(); run(async () => { await api("/api/admin/content", { method: "POST", json: { type: "entry", ...edit, tags: edit.tags.split(",").map((t) => t.trim()).filter(Boolean) } }); setEdit(null); }); }}>
          <div className="row">
            <select className="input" style={{ width: 140 }} value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value as ContentEntry["kind"] })}>{["faq", "fee", "course", "policy"].map((k) => <option key={k}>{k}</option>)}</select>
            <input className="input" style={{ flex: 1 }} placeholder="Title / question" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} required minLength={3} />
          </div>
          <textarea className="input" placeholder="Approved answer" value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} required minLength={10} />
          <input className="input" placeholder="Keywords, comma separated (help the helper find this)" value={edit.tags} onChange={(e) => setEdit({ ...edit, tags: e.target.value })} />
          <label className="row" style={{ fontWeight: 700 }}><input type="checkbox" checked={edit.approved} onChange={(e) => setEdit({ ...edit, approved: e.target.checked })} /> Approved for the helper</label>
          <div className="row"><button className="btn btn-primary btn-sm">Save</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setEdit(null)}>Cancel</button></div>
        </form>
      )}
      <div className="rows">
        {data?.entries.map((e) => (
          <div key={e.id} className="row between" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
            <span><span className="pill">{e.kind}</span> {e.approved ? <span className="pill green">approved</span> : <span className="pill amber">draft</span>} <strong>{e.title}</strong><br /><span className="muted caption">{e.body}</span></span>
            <span className="row" style={{ flexWrap: "nowrap" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEdit({ id: e.id, kind: e.kind, title: e.title, body: e.body, tags: e.tags.join(", "), approved: e.approved })}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => confirm(`Delete "${e.title}"?`) && run(() => api(`/api/admin/content/${e.id}`, { method: "DELETE" }))}>Delete</button>
            </span>
          </div>
        ))}
      </div>

      <h3>Courses &amp; fees</h3>
      <div className="rows">
        {data?.courses.map((c) => (
          <form key={c.id} className="row" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); run(() => api("/api/admin/content", { method: "POST", json: { type: "course", id: c.id, name: f.get("name"), description: f.get("description"), weeks: f.get("weeks"), fee_inr: f.get("fee"), active: f.get("active") === "on" } })); }}>
            <input name="name" className="input" style={{ flex: 1, minWidth: 160 }} defaultValue={c.name} aria-label="Name" />
            <input name="description" className="input" style={{ flex: 2, minWidth: 220 }} defaultValue={c.description} aria-label="Description" />
            <input name="weeks" type="number" className="input" style={{ width: 80 }} defaultValue={c.weeks} aria-label="Weeks" />
            <input name="fee" type="number" className="input" style={{ width: 110 }} defaultValue={c.fee_inr} aria-label="Fee in rupees" />
            <label className="row" style={{ margin: 0 }}><input name="active" type="checkbox" defaultChecked={c.active} /> active</label>
            <button className="btn btn-lime btn-sm">Save</button>
          </form>
        ))}
      </div>
      <p className="caption muted">Remember to update the &ldquo;Course fees&rdquo; FAQ entry too when fees change — the helper answers from it.</p>
    </div>
  );
}
