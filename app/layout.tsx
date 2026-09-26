import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { appUrl } from "@/lib/utils";

const inter = Inter({ subsets: ["latin", "latin-ext"], display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "BAL Notes", template: "%s | BAL Notes" },
  description: "Bornova Anadolu Lisesi öğrencilerinin not paylaşım platformu.",
  openGraph: { title: "BAL Notes", description: "Notunu paylaş, sınıfını ileri taşı.", type: "website", locale: "tr_TR" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <SiteHeader />
          <main className="site-main">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
