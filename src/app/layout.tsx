import type { Metadata } from "next";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3200";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Pulse — product analytics for SaaS teams",
    template: "%s · Pulse",
  },
  description:
    "Product analytics dashboard: MRR, cohorts, activation funnel, account health and revenue movement in one place.",
  openGraph: {
    type: "website",
    url: appUrl,
    siteName: "Pulse",
    title: "Pulse — product analytics for SaaS teams",
    description:
      "MRR, cohorts, activation funnel and revenue movement. A portfolio case built with Next.js, Prisma and custom SVG charts.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
