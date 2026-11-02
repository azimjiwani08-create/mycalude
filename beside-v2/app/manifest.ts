import type { MetadataRoute } from "next";

/** Lets "Add to Home Screen" open Beside full-screen, without the browser bars. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "beside",
    short_name: "beside",
    description: "Good company, in public places.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFFFFF",
    theme_color: "#FFFFFF",
    icons: [{ src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" }],
  };
}
