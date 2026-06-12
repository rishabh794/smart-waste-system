import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Smart Waste System",
    short_name: "Smart Waste",
    description: "Route optimization and bin tracking for citizens and drivers",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f8fcf9",
    theme_color: "#197443",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
