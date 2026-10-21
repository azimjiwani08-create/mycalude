import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Towie } from "@/components/Illustrations";
import { getSession } from "@/lib/session";
import { isLive } from "@/lib/env";

export const metadata: Metadata = {
  title: { default: "Edu Tower — English, IELTS, PTE & CELPIP", template: "%s · Edu Tower" },
  description: "Free diagnostic, small batches in Mumbai and Vadodara, full mock tests and weekly progress reports.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession().catch(() => null);
  const live = isLive();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@500;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        {!live && <div className="demo-banner">Demo mode — you are seeing sample data. Nothing is sent or saved for real.</div>}
        <header className="site-header">
          <div className="container bar">
            <Link href="/" className="logo" aria-label="Edu Tower home">
              <Towie size={30} />
              <span>edu tower</span>
            </Link>
            <Nav role={session?.user.role ?? null} />
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="container row between">
            <span>Edu Tower (formerly London House of Careers) · Mumbai · Vadodara</span>
            <span className="row">
              <Link href="/privacy">Privacy & data</Link>
              <Link href="/ask">Ask a question</Link>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
