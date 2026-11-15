import type { Metadata } from "next";
import "./globals.css";
import { getDict, getLocale } from "@/lib/i18n";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3200";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const d = getDict(locale);

  return {
    metadataBase: new URL(appUrl),
    title: {
      default: d.meta.title,
      template: `%s · Pulse`,
    },
    description: d.meta.description,
    openGraph: {
      type: "website",
      url: appUrl,
      siteName: "Pulse",
      title: d.meta.title,
      description: d.meta.description,
      locale: locale === "ru" ? "ru_RU" : "en_US",
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
