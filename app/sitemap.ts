import type { MetadataRoute } from "next";
const BASE = "https://docs.anantatrade.com";
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`,        lastModified: now, priority: 1.0,
      changeFrequency: "weekly" },
    { url: `${BASE}/pricing`, lastModified: now, priority: 0.9,
      changeFrequency: "weekly" },
    { url: `${BASE}/terms`,   lastModified: now, priority: 0.3,
      changeFrequency: "monthly" },
    { url: `${BASE}/privacy`, lastModified: now, priority: 0.3,
      changeFrequency: "monthly" },
    { url: `${BASE}/refunds`, lastModified: now, priority: 0.3,
      changeFrequency: "monthly" },
    { url: `${BASE}/contact`, lastModified: now, priority: 0.4,
      changeFrequency: "monthly" },
  ];
}
