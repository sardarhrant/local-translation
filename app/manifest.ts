import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Translations",
    short_name: "Translations",
    description:
      "English–Russian word and phrase flashcards, stored locally in your browser.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#18181b",
    icons: [
      {
        src: "/pwa-icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon-maskable-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
