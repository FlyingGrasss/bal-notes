import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { appUrl, homeworkAppUrl } from "@/lib/utils";

const isHomework = process.env.SITE_MODE === "homework";
const siteName = isHomework ? "BAL Ödevler" : "BAL Notes";
const siteDescription = isHomework
  ? "Bornova Anadolu Lisesi okul ödevleri."
  : "Bornova Anadolu Lisesi öğrencilerinin not paylaşım platformu.";
const siteUrl = isHomework ? homeworkAppUrl() : appUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteName, template: `%s | ${siteName}` },
  description: siteDescription,
  openGraph: { title: siteName, description: siteDescription, type: "website", locale: "tr_TR" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className="antialiased">
        <Providers>
          <SiteHeader />
          <main className="site-main">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
