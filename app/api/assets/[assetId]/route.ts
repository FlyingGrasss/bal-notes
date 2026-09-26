import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  const asset = await db.noteAsset.findUnique({
    where: { id: assetId },
    include: { note: { select: { authorId: true, status: true } } },
  });
  if (!asset) return new NextResponse("Dosya bulunamadı.", { status: 404 });

  if (asset.note.status === "DRAFT") {
    const user = await getCurrentUser();
    if (!user || (user.id !== asset.note.authorId && !user.isAdmin)) return new NextResponse("Dosya bulunamadı.", { status: 404 });
  }

  const result = await get(asset.pathname, { access: "private" });
  if (!result || result.statusCode !== 200) return new NextResponse("Dosya bulunamadı.", { status: 404 });
  const encodedName = encodeURIComponent(asset.originalName);
  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": asset.contentType,
      "Content-Length": String(asset.size),
      "Content-Disposition": `inline; filename*=UTF-8''${encodedName}`,
      "Cache-Control": asset.note.status === "DRAFT" ? "private, no-store" : "public, max-age=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
