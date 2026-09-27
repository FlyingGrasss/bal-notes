"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpen, Home, Menu, Plus, Quote, Shield, UserRound, X } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { buttonStyles } from "@/components/ui/button";
import type { SiteMode } from "@/lib/site";

export type HeaderUser = {
  name: string;
  picture: string | null;
  isAdmin: boolean;
};

const notesLinks = [
  { href: "/notlar", label: "Notlar", icon: BookOpen },
  { href: "/sozler", label: "Hoca Sözleri", icon: Quote },
];

export function SiteHeaderClient({ user, site }: { user: HeaderUser | null; site: SiteMode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const siteName = site === "homework" ? "BAL Ödevler" : "BAL Notes";

  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="site-header fixed left-0 right-0 top-0 z-50 flex h-16 border-b border-gray-100 bg-white/95 shadow-md backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex h-full items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label={`${siteName} ana sayfa`} onClick={() => setMenuOpen(false)}>
            <Image src="/bal-logo.png" alt="Bornova Anadolu Lisesi" width={40} height={40} priority className="size-10 rounded-full object-contain" />
            <span className="whitespace-nowrap text-sm font-bold tracking-tight text-ink sm:text-xl">{siteName}</span>
          </Link>

          {site === "notes" ? <nav className="hidden items-center gap-7 lg:flex" aria-label="Ana menü">
            <HeaderLink href="/" label="Ana Sayfa" active={pathname === "/"} dark={false} />
            {notesLinks.map((link) => <HeaderLink key={link.href} href={link.href} label={link.label} active={active(link.href)} dark={false} />)}
          </nav> : <span aria-hidden="true" />}

          <div className="flex items-center gap-4">
            {user ? <div className="flex items-center gap-3">
              {site === "notes" ? <Link href="/paylas" className={`${buttonStyles({ size: "sm" })} hidden sm:inline-flex`}><Plus size={16} /> Paylaş</Link> : null}
              {user.isAdmin ? <Link href="/admin" aria-label="Yönetim" className="hidden size-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 sm:flex"><Shield size={16} /></Link> : null}
              <Link href="/profil" aria-label="Profil"><Avatar name={user.name} picture={user.picture} className="size-8" /></Link>
            </div> : site === "notes" ? <Link href="/auth/bal-id" className={`${buttonStyles({ size: "sm" })} hidden sm:inline-flex`}>BAL ID ile Giriş</Link> : null}
            {site === "notes" ? <button type="button" onClick={() => setMenuOpen((open) => !open)} className="p-2 text-ink lg:hidden" aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"} aria-expanded={menuOpen} aria-controls="site-mobile-navigation">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button> : null}
          </div>
        </div>
      </div>

      {menuOpen ? <div id="site-mobile-navigation" className="absolute left-0 right-0 top-16 border-t border-gray-100 bg-white shadow-xl lg:hidden">
        <nav className="flex flex-col gap-2 p-4" aria-label="Mobil menü">
          {site === "notes" ? <><MobileLink href="/" label="Ana Sayfa" icon={<Home size={18} />} active={pathname === "/"} dark={false} onClick={() => setMenuOpen(false)} />{notesLinks.map((link) => <MobileLink key={link.href} href={link.href} label={link.label} icon={<link.icon size={18} />} active={active(link.href)} dark={false} onClick={() => setMenuOpen(false)} />)}</> : null}
          {site === "notes" && user ? <MobileLink href="/paylas" label="Paylaş" icon={<Plus size={18} />} active={pathname === "/paylas"} dark={false} onClick={() => setMenuOpen(false)} /> : null}
          {user?.isAdmin ? <MobileLink href="/admin" label="Yönetim" icon={<Shield size={18} />} active={active("/admin")} dark={false} onClick={() => setMenuOpen(false)} /> : null}
          {user ? <MobileLink href="/profil" label="Profilim" icon={<UserRound size={18} />} active={active("/profil")} dark={false} onClick={() => setMenuOpen(false)} /> : site === "notes" ? <MobileLink href="/auth/bal-id" label="BAL ID ile Giriş" icon={<UserRound size={18} />} dark={false} onClick={() => setMenuOpen(false)} /> : null}
        </nav>
      </div> : null}
    </header>
  );
}

function HeaderLink({ href, label, active, dark }: { href: string; label: string; active: boolean; dark: boolean }) {
  return <Link href={href} aria-current={active ? "page" : undefined} className={`text-sm font-medium transition-colors ${active ? "text-bal" : dark ? "text-white/60 hover:text-white" : "text-gray-500 hover:text-bal"} ${active && dark ? "text-[#ff6b79]" : ""}`}>{label}</Link>;
}

function MobileLink({ href, label, icon, active = false, dark, onClick }: { href: string; label: string; icon: React.ReactNode; active?: boolean; dark: boolean; onClick: () => void }) {
  return <Link href={href} onClick={onClick} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all ${active ? "font-bold text-[#ff6b79]" : dark ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-gray-600 hover:bg-gray-50 hover:text-bal"}`}>{icon}<span>{label}</span></Link>;
}
