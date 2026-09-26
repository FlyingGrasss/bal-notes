import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { getSiteMode } from "@/lib/site";

export async function SiteFooter() {
  const site = getSiteMode((await headers()).get("host"));
  const links = site === "homework"
    ? [{ href: "/odevler", label: "Ödevler" }]
    : [{ href: "/notlar", label: "Notlar" }, { href: "/sozler", label: "Hoca Sözleri" }, { href: "/paylas", label: "İçerik Paylaş" }];
  return (
    <footer className="mt-20 border-t border-black/8 bg-ink py-10 text-white sm:mt-28 sm:py-12">
      <div className="container-shell flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
        <div className="flex items-center gap-3">
          <Image src="/bal-logo.png" alt="" width={46} height={46} className="size-11 rounded-full bg-white object-contain" />
          <div><p className="font-black">{site === "homework" ? "BAL Ödevler" : "BAL Notes"}</p><p className="mt-1 text-xs text-white/50">Bornova Anadolu Lisesi öğrencileri için.</p></div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-white/60">{links.map((link) => <Link key={link.href} href={link.href} className="hover:text-white">{link.label}</Link>)}</div>
      </div>
    </footer>
  );
}
