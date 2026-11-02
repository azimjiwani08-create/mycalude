import type { Metadata, Viewport } from "next";
import { SessionProvider } from "@/lib/session";
import { HomeDock } from "@/components/browse/HomeDock";
import { LivePill } from "@/components/safety/LivePill";
import { LaunchSplash } from "@/components/brand/LaunchSplash";
import { SafeArea } from "@/components/ui/SafeArea";
import "./globals.css";

export const metadata: Metadata = {
  appleWebApp: { capable: true, title: "beside", statusBarStyle: "black-translucent" },
  title: "Beside",
  description:
    "Good conversation, in good company. Public places, verified people, your pace.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN">
      <head>
        {/* Zodiak and Supreme from Fontshare. */}
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=zodiak@400&display=swap" />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=supreme@400&display=swap" />
      </head>
      <body>
        <SessionProvider>
          {children}
          <LivePill />
          <HomeDock />
        </SessionProvider>
        <SafeArea />
        <LaunchSplash />
      </body>
    </html>
  );
}
