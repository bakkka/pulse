import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3200";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app", "/app/", "/login", "/api/"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
