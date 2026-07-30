import type { MetadataRoute } from "next";
import { NOM_RESIDENCE } from "@/lib/residence";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${NOM_RESIDENCE} — Espace employés`,
    short_name: "Soleil Levant",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#d97706",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
