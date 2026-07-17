import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://playground.brandrail.dev";
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/agents`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/sample`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/docs`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/help`, changeFrequency: "weekly", priority: 0.8 },
  ];
}
