import type { Metadata } from "next";
import { requirePageRole } from "@/lib/page-auth";
import { isLive } from "@/lib/env";
import { AdminShell } from "./shell";

export const metadata: Metadata = { title: "Staff" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requirePageRole(["admin", "counsellor", "teacher"]);
  return (
    <div className="container section" style={{ paddingTop: 40 }}>
      <div className="row between" style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>{user.full_name}</h1>
        <span className="pill blue">{user.role}{user.office_id ? ` · ${user.office_id}` : " · all offices"}</span>
      </div>
      <AdminShell role={user.role} live={isLive()} />
    </div>
  );
}
