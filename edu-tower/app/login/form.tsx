"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/components/api";

const HOME: Record<string, string> = { student: "/portal", parent: "/parent", admin: "/admin", counsellor: "/admin", teacher: "/admin" };

export function LoginForm({ live, demoUsers }: { live: boolean; demoUsers: { id: string; name: string; role: string; office: string | null }[] }) {
  const router = useRouter();
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const id = () => (method === "phone" ? { phone: value } : { email: value });

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try { await api("/api/auth/otp", { method: "POST", json: id() }); setSent(true); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const r = await api<{ role: string }>("/api/auth/verify", { method: "POST", json: { ...id(), token: code } });
      router.push(HOME[r.role] ?? "/"); router.refresh();
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  async function demo(userId: string) {
    setBusy(true); setError(null);
    try {
      const r = await api<{ role: string }>("/api/auth/demo", { method: "POST", json: { user_id: userId } });
      router.push(HOME[r.role] ?? "/"); router.refresh();
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="stack" style={{ gap: 28 }}>
      {live ? (
        !sent ? (
          <form className="stack" onSubmit={send}>
            <div className="row">
              <button type="button" className={`btn btn-sm ${method === "phone" ? "btn-blue" : "btn-ghost"}`} onClick={() => setMethod("phone")}>Phone</button>
              <button type="button" className={`btn btn-sm ${method === "email" ? "btn-blue" : "btn-ghost"}`} onClick={() => setMethod("email")}>Email</button>
            </div>
            <div className="field">
              <label htmlFor="id">{method === "phone" ? "Mobile number" : "Email"}</label>
              <input id="id" className="input" value={value} onChange={(e) => setValue(e.target.value)} required inputMode={method === "phone" ? "tel" : "email"} autoComplete={method === "phone" ? "tel" : "email"} />
            </div>
            <button className="btn btn-primary" disabled={busy}>Send me a code</button>
          </form>
        ) : (
          <form className="stack" onSubmit={verify}>
            <div className="field">
              <label htmlFor="code">6-digit code</label>
              <input id="code" className="input" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required />
            </div>
            <button className="btn btn-primary" disabled={busy || code.length !== 6}>Log in</button>
            <button type="button" className="btn btn-ghost" onClick={() => setSent(false)}>Use a different number</button>
          </form>
        )
      ) : (
        <div className="stack">
          <div className="notice">Demo mode: pick a sample person to see the site as they would. Phone/email OTP login switches on with the backend.</div>
          <div className="rows">
            {demoUsers.map((u) => (
              <div key={u.id} className="row between">
                <span><strong>{u.name}</strong><br /><span className="caption muted upper">{u.role}{u.office ? ` · ${u.office}` : ""}</span></span>
                <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => demo(u.id)}>Continue</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
