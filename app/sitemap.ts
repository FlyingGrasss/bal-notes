import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { appUrl, homeworkAppUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const isHomework = process.env.SITE_MODE === "homework";
  const siteUrl = (isHomework ? homeworkAppUrl() : appUrl()).replace(/\/$/, "");

  if (isHomework) {
    return [{ url: siteUrl, changeFrequency: "daily", priority: 1 }];
  }

  const notes = await db.note.findMany({
    where: { status: "APPROVED" },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: siteUrl + "/notlar", changeFrequency: "daily", priority: 0.95 },
    { url: siteUrl + "/sozler", changeFrequency: "daily", priority: 0.75 },
    ...notes.map((note) => ({
      url: siteUrl + "/notlar/" + note.id,
      lastModified: note.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
