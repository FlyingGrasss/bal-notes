"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, ClipboardList, Home, Menu, Plus, Quote, Shield, UserRound, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { buttonStyles } from "@/components/ui/button";
import type { SiteMode } from "@/lib/site";

export type HeaderUser = {
  name: string;
  picture: string | null;
  isAdmin: boolean;
};

const links = [
  { href: "/notlar", label: "Notlar", icon: BookOpen },
  { href: "/sozler", label: "Hoca Sözleri", icon: Quote },
  { href: "/odevler", label: "Ödevler", icon: ClipboardList },
];

export function SiteHeaderClient({ user, site }: { user: HeaderUser | null; site: SiteMode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let previous = window.scrollY;
    const onScroll = () => {
      const current = window.scrollY;
      setHidden(current > 84 && current > previous && !menuOpen);
      if (current < 24) setHidden(false);
      previous = current;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const visibleLinks = site === "homework" ? links.filter((link) => link.href === "/odevler") : links.filter((link) => link.href !== "/odevler");
  const siteName = site === "homework" ? "BAL Ödevler" : "BAL Notes";

  return (
    <header className="site-header fixed inset-x-0 top-0 z-50 border-b border-black/8 bg-white/92 backdrop-blur-xl" data-hidden={hidden && !menuOpen}>
      <div className="container-shell flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={`${siteName} ana sayfa`} onClick={() => setMenuOpen(false)}>
          <Image src="/bal-logo.png" alt="Bornova Anadolu Lisesi" width={42} height={42} priority className="size-10 shrink-0 rounded-full object-contain sm:size-11" />
          <div className="min-w-0">
            <span className="block truncate text-[1.05rem] font-black leading-none tracking-[-0.04em]">{siteName}</span>
            <span className="mt-1 hidden text-[9px] font-bold uppercase tracking-[0.15em] text-bal sm:block">{site === "homework" ? "Okul geneli" : "Öğrenciden öğrenciye"}</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Ana menü">
          <NavLink href="/" label="Ana Sayfa" active={pathname === "/"} />
          {visibleLinks.map((link) => <NavLink key={link.href} href={link.href} label={link.label} active={isActive(link.href)} />)}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {site === "notes" ? <Link href="/paylas" className={`${buttonStyles({ size: "sm" })} hidden sm:inline-flex`}><Plus size={16} /> Paylaş</Link> : null}
              {user.isAdmin ? <Link href="/admin" className={`${buttonStyles({ variant: "ghost", size: "icon" })} hidden sm:grid`} aria-label="Yönetim"><Shield size={18} /></Link> : null}
              <Link href="/profil" aria-label="Profil"><Avatar name={user.name} picture={user.picture} className="size-9" /></Link>
            </>
          ) : (
            <Link href={site === "homework" ? "/odevler/giris" : "/auth/bal-id"} className={`${buttonStyles({ size: "sm" })} hidden sm:inline-flex`}>{site === "homework" ? "Yazar girişi" : "BAL ID ile Giriş"}</Link>
          )}
          <button type="button" className="grid size-10 place-items-center rounded-xl text-ink hover:bg-black/5 lg:hidden" aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-line bg-white px-4 pb-4 pt-2 shadow-lg lg:hidden">
          <nav className="container-shell flex flex-col gap-1" aria-label="Mobil menü">
            <MobileNavLink href="/" label="Ana Sayfa" icon={<Home size={18} />} active={pathname === "/"} onClick={() => setMenuOpen(false)} />
            {visibleLinks.map((link) => <MobileNavLink key={link.href} href={link.href} label={link.label} icon={<link.icon size={18} />} active={isActive(link.href)} onClick={() => setMenuOpen(false)} />)}
            {site === "notes" ? <MobileNavLink href="/paylas" label="Paylaş" icon={<Plus size={18} />} active={pathname === "/paylas"} onClick={() => setMenuOpen(false)} /> : null}
            {user?.isAdmin ? <MobileNavLink href="/admin" label="Yönetim" icon={<Shield size={18} />} active={isActive("/admin")} onClick={() => setMenuOpen(false)} /> : null}
            {!user ? <MobileNavLink href={site === "homework" ? "/odevler/giris" : "/auth/bal-id"} label={site === "homework" ? "Yazar girişi" : "BAL ID ile Giriş"} icon={<UserRound size={18} />} onClick={() => setMenuOpen(false)} /> : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return <Link href={href} aria-current={active ? "page" : undefined} className={`rounded-lg px-3 py-2 text-sm font-bold ${active ? "bg-bal-soft text-bal" : "text-muted hover:bg-black/5 hover:text-ink"}`}>{label}</Link>;
}

function MobileNavLink({ href, label, icon, active, onClick }: { href: string; label: string; icon: React.ReactNode; active?: boolean; onClick: () => void }) {
  return <Link href={href} onClick={onClick} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${active ? "bg-bal-soft text-bal" : "text-ink hover:bg-paper-deep"}`}>{icon}<span>{label}</span></Link>;
}
