import type { MetadataRoute } from "next";

const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3200").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${base}/`, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
