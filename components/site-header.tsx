import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeaderClient, type HeaderUser } from "@/components/site-header-client";
import { getSiteMode } from "@/lib/site";
import { headers } from "next/headers";

export async function SiteHeader() {
  const host = (await headers()).get("host");
  const user = await getCurrentUser();
  const headerUser: HeaderUser | null = user
    ? { name: user.name, picture: user.picture, isAdmin: user.isAdmin }
    : null;

  return <SiteHeaderClient user={headerUser} site={getSiteMode(host)} />;
}

export function HomeworkHeader() {
  return (
    <header className="site-header fixed left-0 right-0 top-0 z-50 flex h-16 border-b border-gray-100 bg-white/95 shadow-md backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex h-full items-center">
          <Link href="/" className="flex items-center gap-2" aria-label="BAL Ödevler ana sayfa">
            <Image src="/bal-logo.png" alt="Bornova Anadolu Lisesi" width={40} height={40} priority className="size-10 rounded-full object-contain" />
            <span className="whitespace-nowrap text-sm font-bold tracking-tight text-ink sm:text-xl">BAL Ödevler</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
