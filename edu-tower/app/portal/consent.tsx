"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/components/api";

export function ConsentControls({ hasParent, parentShare, minorSigned, keepAudio }: { hasParent: boolean; parentShare: boolean; minorSigned: boolean; keepAudio: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function toggle(kind: "parent_share" | "audio_retention", on: boolean) {
    setBusy(true); setError(null);
    try { await api("/api/consents", { method: "POST", json: { kind, action: on ? "grant" : "revoke" } }); router.refresh(); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <section className="card stack">
      <h2>Privacy choices</h2>
      <div className="row between">
        <span><strong>Share my weekly report with my parent</strong><br /><span className="caption muted">{!hasParent ? "No parent is linked to your account." : parentShare ? (minorSigned ? "On. Your parent sees your weekly report and scores." : "On — but because you're under 18, your parent also needs to sign a consent form at the office first.") : "Off. Your parent sees nothing."}</span></span>
        {hasParent && <button className={`btn btn-sm ${parentShare ? "btn-danger" : "btn-lime"}`} disabled={busy} onClick={() => toggle("parent_share", !parentShare)}>{parentShare ? "Stop sharing" : "Share"}</button>}
      </div>
      <div className="row between">
        <span><strong>Keep my speaking recordings</strong><br /><span className="caption muted">{keepAudio ? "On. Kept until 90 days after your course." : "Off. Recordings are deleted right after marking."}</span></span>
        <button className={`btn btn-sm ${keepAudio ? "btn-danger" : "btn-lime"}`} disabled={busy} onClick={() => toggle("audio_retention", !keepAudio)}>{keepAudio ? "Delete after marking" : "Keep them"}</button>
      </div>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
