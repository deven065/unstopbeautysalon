import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GlowNest Mumbai",
    short_name: "GlowNest",
    description:
      "Verified Mumbai salon discovery, transparent pricing, and AI-assisted booking.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff9f7",
    theme_color: "#fff9f7",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "256x256",
        type: "image/x-icon",
      },
    ],
  };
}
