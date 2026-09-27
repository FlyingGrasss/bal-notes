import Link from "next/link";
import { headers } from "next/headers";
import { getSiteMode } from "@/lib/site";

export async function SiteFooter() {
  const site = getSiteMode((await headers()).get("host"));
  const appName = site === "homework" ? "BAL Ödevler" : "BAL Notes";
  const links = site === "homework"
    ? [{ href: "/odevler", label: "Ödevler" }]
    : [{ href: "/notlar", label: "Notlar" }, { href: "/sozler", label: "Hoca Sözleri" }, { href: "/paylas", label: "İçerik Paylaş" }];

  return (
    <footer className="mt-auto hidden bg-[#a21a2a] py-12 sm:block">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row">
        <div className="text-center md:text-left">
          <p className="mb-1 text-xl font-bold text-white">{appName}</p>
          <p className="text-sm font-medium text-white/85">Bornova Anadolu Lisesi öğrencileri için © 2026</p>
          <p className="mt-3 text-xs text-white/85">BAL öğrencilerinin ortak arşivi.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {links.map((link) => <Link key={link.href} href={link.href} className="text-sm font-bold tracking-wide text-white/80 transition hover:text-white">{link.label}</Link>)}
          <a href="https://www.instagram.com/balogrenci/" target="_blank" rel="noopener noreferrer" className="text-sm font-bold tracking-wide text-white/80 transition hover:text-white">Instagram</a>
          <a href="https://linktr.ee/baloder" target="_blank" rel="noopener noreferrer" className="text-sm font-bold tracking-wide text-white/80 transition hover:text-white">Linktree</a>
        </div>
      </div>
    </footer>
  );
}
