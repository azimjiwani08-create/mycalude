"use client";
import { useState } from "react";
import { api } from "@/components/api";
import { fmtDate, statusPill } from "@/components/ui";
import { hoursLeft, useLoad, type TabProps } from "./common";
import type { Booking, Batch, Course, Diagnostic } from "@/lib/types";

type Row = Booking & { batch?: Batch; course: Course | null; diagnostic: Diagnostic | null; chat: string };

export function BookingsTab(_: TabProps) {
  const [status, setStatus] = useState("held");
  const { data, error, reload, setError } = useLoad<{ bookings: Row[] }>(`/api/admin/bookings?status=${status}`);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function act(b: Row, action: "confirm" | "cancel") {
    setBusy(b.id); setFlash(null);
    try {
      const r = await api<{ whatsapp?: string; chat?: string }>(`/api/admin/bookings/${b.id}`, { method: "POST", json: { action } });
      if (action === "confirm") {
        setFlash(r.whatsapp === "sent" ? `${b.full_name} confirmed and messaged on WhatsApp.` : `${b.full_name} confirmed and enrolled. WhatsApp API isn't connected, so tap "Open chat" to send the confirmation yourself.`);
        if (r.whatsapp !== "sent" && r.chat) window.open(r.chat, "_blank", "noopener");
      }
      reload();
    } catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  }

  return (
    <div className="stack">
      <div className="row">{["held", "confirmed", "expired", "cancelled"].map((s) => <button key={s} className={`btn btn-sm ${status === s ? "btn-blue" : "btn-ghost"}`} onClick={() => setStatus(s)}>{s}</button>)}</div>
      {flash && <div className="notice">{flash}</div>}
      {error && <p className="error">{error}</p>}
      {data?.bookings.length === 0 && <p className="muted">Nothing here.</p>}
      <div className="rows">
        {data?.bookings.map((b) => (
          <div key={b.id} className="row between">
            <span className="stack" style={{ gap: 2 }}>
              <strong>{b.full_name}</strong>
              <span className="caption muted">{b.course?.name} · {b.batch?.schedule} · starts {b.batch ? fmtDate(b.batch.start_date) : "?"} · {b.office_id}</span>
              <span className="row" style={{ gap: 6 }}>
                {statusPill(b.status)}
                {b.status === "held" && <span className="pill amber">{hoursLeft(b.held_until)}</span>}
                {b.diagnostic && <span className="pill blue">Diagnostic {b.diagnostic.band_estimate.toFixed(1)} est. · weakest {b.diagnostic.weakest_skill}</span>}
              </span>
            </span>
            <span className="row">
              <a className="btn btn-ghost btn-sm" href={b.chat} target="_blank" rel="noopener noreferrer">Open chat</a>
              {b.status === "held" && <>
                <button className="btn btn-primary btn-sm" disabled={busy === b.id} onClick={() => act(b, "confirm")}>Confirm seat</button>
                <button className="btn btn-danger btn-sm" disabled={busy === b.id} onClick={() => act(b, "cancel")}>Cancel</button>
              </>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
