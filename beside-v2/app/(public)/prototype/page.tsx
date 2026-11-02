import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { IconButton } from "@/components/ui/Button";
import { TopBar } from "@/components/ui/Frame";
import { ResetPrototype } from "@/components/member/ResetPrototype";
import { ICON } from "@/lib/icons";

const groups: [string, [string, string][]][] = [
  [
    "Member flow",
    [
      ["Welcome and photo rail", "/"],
      ["Rail: loading state", "/?rail=loading"],
      ["Rail: empty state", "/?rail=empty"],
      ["Rail: error state", "/?rail=error"],
      ["Login", "/login"],
      ["Verification steps", "/verify"],
      ["Ground rules", "/rules"],
      ["Companion profile (Meera)", "/companions/meera"],
      ["Plan a session", "/plan"],
      ["Your profile", "/profile"],
      ["Saved and past companions", "/companions"],
    ],
  ],
  [
    "Chat and session",
    [
      ["Messages inbox", "/chat"],
      ["Chat, active (Meera)", "/chat/s1"],
      ["Chat, empty (Kavya)", "/chat/s3"],
      ["Chat, closed (Tara)", "/chat/s2"],
      ["Live session with SOS", "/session/s1"],
    ],
  ],
  [
    "Companion side",
    [
      ["Requests", "/requests"],
      ["Chat as Meera", "/requests/s1"],
    ],
  ],
  ["Operations", [["Live sessions (desktop, 1440)", "/live"]]],
];

export default function PrototypeMapPage() {
  // Developer route map: never in production unless explicitly switched on.
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SHOW_ROUTE_MAP !== "1") notFound();

  return (
    <main className="pb-16">
      <TopBar>
        <IconButton label="Back" href="/">
          <ArrowLeft size={ICON.md} />
        </IconButton>
      </TopBar>
      <div className="px-5 pt-6">
        <h1 className="font-serif text-headline text-ink">Prototype map</h1>
        <p className="mt-2 text-ink-2">
          Member screens need verification first. Run through login once, or open a member screen and follow the gate.
        </p>
        {groups.map(([title, links]) => (
          <section key={title} className="mt-8">
            <h2 className="text-caption uppercase tracking-wide text-ink-2">{title}</h2>
            <ul className="mt-2 divide-y divide-line border-y-[1.5px] border-line">
              {links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="flex min-h-12 items-center justify-between py-3 text-ink hover:text-ink">
                    {label}
                    <span className="text-caption text-ink-2">{href}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <ResetPrototype />
      </div>
    </main>
  );
}
