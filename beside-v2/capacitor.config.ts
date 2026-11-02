import type { CapacitorConfig } from "@capacitor/cli";

/*
 * The iOS shell loads Beside from the dev server, so changes show up live.
 * 127.0.0.1 is how the Simulator reaches this Mac. Point `url` at the Vercel
 * link (and drop cleartext) for a build that doesn't need the dev server.
 */
const config: CapacitorConfig = {
  appId: "com.beside.app",
  appName: "beside",
  webDir: "public",
  // Add ?demo=member to the URL to open as a signed-in test member (development only).
  server: { url: "http://127.0.0.1:3000/?demo=member", cleartext: true },
  ios: { contentInset: "never", backgroundColor: "#FFFFFF" },
};

export default config;
