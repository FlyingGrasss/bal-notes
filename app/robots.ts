import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = appUrl().replace(/\/$/, "");
  const disallow = ["/admin", "/auth", "/paylas", "/profil", "/api/", "/notlar/filtre"];

  return {
    rules: { userAgent: "*", allow: "/", disallow },
    sitemap: siteUrl + "/sitemap.xml",
    host: siteUrl,
  };
}
