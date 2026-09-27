import type { MetadataRoute } from "next";
import { appUrl, homeworkAppUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  const isHomework = process.env.SITE_MODE === "homework";
  const siteUrl = (isHomework ? homeworkAppUrl() : appUrl()).replace(/\/$/, "");
  const disallow = isHomework
    ? ["/admin", "/auth", "/login", "/odevler/panel", "/api/", "/notlar", "/sozler", "/paylas", "/profil"]
    : ["/admin", "/auth", "/paylas", "/profil", "/api/", "/odevler", "/notlar/filtre"];

  return {
    rules: { userAgent: "*", allow: "/", disallow },
    sitemap: siteUrl + "/sitemap.xml",
    host: siteUrl,
  };
}
