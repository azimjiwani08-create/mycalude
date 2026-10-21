"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function Nav({ role }: { role: string | null }) {
  const path = usePathname();
  const router = useRouter();
  const links: [string, string, string?][] = [
    ["/courses", "Courses", "hide-sm"],
    ["/diagnostic", "Free test"],
    ["/ask", "Ask", "hide-sm"],
  ];
  if (role === "student") links.push(["/portal", "My portal"]);
  if (role === "parent") links.push(["/parent", "My child"]);
  if (role && ["admin", "counsellor", "teacher"].includes(role)) links.push(["/admin", "Staff"]);
  const current = (href: string) => (path === href || path.startsWith(`${href}/`) ? "page" : undefined);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="nav" aria-label="Main">
      {links.map(([href, label, cls]) => (
        <Link key={href} href={href} className={cls} aria-current={current(href)}>
          {label}
        </Link>
      ))}
      {role ? (
        <button className="btn btn-ghost btn-sm" onClick={logout}>Log out</button>
      ) : (
        <Link href="/login" className="btn btn-ghost btn-sm" aria-current={current("/login")}>Log in</Link>
      )}
    </nav>
  );
}
