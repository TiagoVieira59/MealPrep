import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MealPrep", short_name: "MealPrep", lang: "pt-PT",
    description: "A tua semana de refeições, dentro do orçamento, com as contas à vista.",
    start_url: "/", display: "standalone", background_color: "#FAF6EE", theme_color: "#1F6A55",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
