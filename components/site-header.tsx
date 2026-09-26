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
