import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import type { Role } from "@/lib/types";

export async function requirePageRole(roles: Role[]) {
  const session = await getSession().catch(() => null);
  if (!session) redirect("/login");
  if (!roles.includes(session.user.role)) redirect("/");
  return session.user;
}
