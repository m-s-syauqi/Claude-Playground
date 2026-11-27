import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Wallet",
    short_name: "My Wallet",
    description: "Akun dan catatan keuangan pribadi",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#047857",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
