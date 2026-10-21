"use client";
import { useState } from "react";
import { api } from "@/components/api";
import { fmtDate, fmtTime } from "@/components/ui";
import { useLoad, type TabProps } from "./common";
import type { AiLog } from "@/lib/types";

export function UsageTab({ live }: TabProps) {
  const { data, error } = useLoad<{ since: string; byFeature: Record<string, { calls: number; tokens: number; cost: number }>; recent: AiLog[] }>("/api/admin/usage");
  const [reset, setReset] = useState(false);
  const total = Object.values(data?.byFeature ?? {}).reduce((a, f) => a + f.cost, 0);
  return (
    <div className="stack" style={{ gap: 20 }}>
      {error && <p className="error">{error}</p>}
      <p className="muted">Last 7 days. A hard monthly spend cap is also set on the OpenAI account; each user has a daily limit.</p>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        {Object.entries(data?.byFeature ?? {}).map(([f, v]) => (
          <div key={f} className="card"><p className="upper caption muted" style={{ margin: 0 }}>{f}</p><p style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "var(--color-eel-dark-blue)" }}>{v.calls}</p><p className="caption muted" style={{ margin: 0 }}>{v.tokens.toLocaleString()} tokens · ${v.cost.toFixed(3)}</p></div>
        ))}
        <div className="card lime"><p className="upper caption muted" style={{ margin: 0 }}>Total cost</p><p style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "var(--color-tree-green)" }}>${total.toFixed(2)}</p></div>
      </div>
      <h3>Recent helper questions (names and numbers removed)</h3>
      <div className="rows">{data?.recent.filter((l) => l.question).map((l) => <div key={l.id}><span className="caption muted">{fmtDate(l.created_at)} {fmtTime(l.created_at)} · {l.model}</span><br /><strong>{l.question}</strong><br /><span className="muted">{l.answer}</span></div>)}</div>
      {!live && (
        <div className="row"><button className="btn btn-danger btn-sm" onClick={async () => { await api("/api/admin/demo-reset", { method: "POST" }); setReset(true); }}>Reset demo data</button>{reset && <span className="pill green">Reset — reload the page</span>}</div>
      )}
    </div>
  );
}
