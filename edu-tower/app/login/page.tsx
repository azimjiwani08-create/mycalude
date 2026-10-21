import type { Metadata } from "next";
import { isLive } from "@/lib/env";
import { withPageDb } from "@/lib/pipeline";
import { LoginForm } from "./form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  const live = isLive();
  const demoUsers = live ? [] : await withPageDb((db) => db.select("users"));
  return (
    <div className="container section" style={{ maxWidth: 560 }}>
      <h1 className="display" style={{ fontSize: 40 }}>Log in</h1>
      <LoginForm live={live} demoUsers={demoUsers.map((u) => ({ id: u.id, name: u.full_name, role: u.role, office: u.office_id }))} />
    </div>
  );
}
