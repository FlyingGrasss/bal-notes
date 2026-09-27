import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
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
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteName, template: `%s | ${siteName}` },
  description: siteDescription,
  openGraph: { title: siteName, description: siteDescription, type: "website", locale: "tr_TR" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <Suspense fallback={<div className="h-16" aria-hidden="true" />}><SiteHeader /></Suspense>
          <main className="site-main">{children}</main>
          <Suspense fallback={<div className="mt-20 min-h-32" aria-hidden="true" />}><SiteFooter /></Suspense>
        </Providers>
      </body>
    </html>
  );
}
