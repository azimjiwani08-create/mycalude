"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/components/api";
import { fmtDate, inr } from "@/components/ui";
import { Towie } from "@/components/Illustrations";
import type { BatchWithSeats, Course, Office, OfficeId } from "@/lib/types";

interface Catalogue { courses: Course[]; offices: Office[]; batches: BatchWithSeats[] }

export function BookingFlow({ initialCourse, diagnosticId }: { initialCourse: string | null; diagnosticId: string | null }) {
  const [cat, setCat] = useState<Catalogue | null>(null);
  const [course, setCourse] = useState<string | null>(initialCourse);
  const [office, setOffice] = useState<OfficeId | null>(null);
  const [batch, setBatch] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ held_until: string; whatsapp: string } | null>(null);

  const load = () => api<Catalogue>("/api/catalogue").then(setCat).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const batches = useMemo(() => (cat?.batches ?? []).filter((b) => b.course_id === course && (!office || b.office_id === office)), [cat, course, office]);
  const selectedCourse = cat?.courses.find((c) => c.id === course);

  async function book(e: React.FormEvent) {
    e.preventDefault();
    if (!batch) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ booking: { held_until: string }; whatsapp: string }>("/api/bookings", { method: "POST", json: { batch_id: batch, full_name: name, phone, diagnostic_id: diagnosticId } });
      setDone({ held_until: r.booking.held_until, whatsapp: r.whatsapp });
    } catch (err) {
      setError((err as Error).message);
      load();
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="stack" style={{ gap: 20, maxWidth: 560 }}>
        <Towie size={90} wave />
        <h1 className="display" style={{ fontSize: 40 }}>Your seat is held!</h1>
        <p style={{ fontSize: 17 }}>We&apos;re holding it until <strong>{new Date(done.held_until).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</strong>. A counsellor will confirm with you on WhatsApp — usually within a few hours.</p>
        {diagnosticId && <div className="notice">Your diagnostic result is attached to this booking.</div>}
        <a className="btn btn-primary" href={done.whatsapp} target="_blank" rel="noopener noreferrer">Message us on WhatsApp</a>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 32 }}>
      <div>
        <h1 className="display" style={{ fontSize: 40 }}>Book a seat</h1>
        <p>Pick a course, an office and a start date. We hold your seat for 48 hours while a counsellor confirms on WhatsApp.</p>
        {diagnosticId && <div className="notice">Diagnostic result attached ✓</div>}
      </div>

      <section className="stack">
        <h2>1. Course</h2>
        <div className="grid">
          {cat?.courses.map((c) => (
            <button key={c.id} type="button" className={`card ${course === c.id ? "selected" : ""}`} aria-pressed={course === c.id} onClick={() => { setCourse(c.id); setBatch(null); }}>
              <h3>{c.name}</h3>
              <p className="muted caption" style={{ minHeight: 40 }}>{c.description}</p>
              <div className="row between"><span className="pill">{c.weeks} weeks</span><strong>{inr(c.fee_inr)}</strong></div>
            </button>
          )) ?? <p className="muted">Loading…</p>}
        </div>
      </section>

      {course && (
        <section className="stack">
          <h2>2. Office</h2>
          <div className="row">
            {cat?.offices.map((o) => (
              <button key={o.id} type="button" className={`btn ${office === o.id ? "btn-blue" : "btn-ghost"}`} aria-pressed={office === o.id} onClick={() => { setOffice(o.id); setBatch(null); }}>
                {o.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {course && office && (
        <section className="stack">
          <h2>3. Start date</h2>
          {batches.length === 0 && <p className="muted">No open batches for {selectedCourse?.name} in this office right now. Try the other office or ask us on WhatsApp.</p>}
          <div className="rows">
            {batches.map((b) => (
              <label key={b.id} className="row between" style={{ cursor: b.seats_left ? "pointer" : "not-allowed", margin: 0, fontWeight: 500, opacity: b.seats_left ? 1 : 0.55 }}>
                <span className="row">
                  <input type="radio" name="batch" value={b.id} checked={batch === b.id} disabled={!b.seats_left} onChange={() => setBatch(b.id)} />
                  <span><strong>Starts {fmtDate(b.start_date, { weekday: "short", day: "numeric", month: "short" })}</strong><br /><span className="muted">{b.schedule}</span></span>
                </span>
                <span className={`pill ${b.seats_left === 0 ? "red" : b.seats_left <= 3 ? "amber" : "green"}`}>{b.seats_left === 0 ? "Full" : `${b.seats_left} of ${b.seats} seats left`}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      {batch && (
        <form className="stack" onSubmit={book} style={{ maxWidth: 480 }}>
          <h2>4. Your details</h2>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="phone">WhatsApp number</label>
            <input id="phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" placeholder="98xxxxxxxx" autoComplete="tel" />
          </div>
          <p className="caption muted">That&apos;s all we need. We never ask for passports, ID or bank documents.</p>
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" disabled={busy}>{busy ? "Holding your seat…" : "Hold my seat for 48 hours"}</button>
        </form>
      )}
      {error && !batch && <p className="error">{error}</p>}
    </div>
  );
}
