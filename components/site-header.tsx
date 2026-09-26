import { getCurrentUser } from "@/lib/auth";
import { SiteHeaderClient, type HeaderUser } from "@/components/site-header-client";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const headerUser: HeaderUser | null = user
    ? { name: user.name, picture: user.picture, isAdmin: user.isAdmin }
    : null;

  return <SiteHeaderClient user={headerUser} />;
}
