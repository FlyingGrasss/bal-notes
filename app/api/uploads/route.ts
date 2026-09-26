import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ALLOWED_UPLOAD_TYPES, MAX_FILE_SIZE, MAX_NOTE_FILES } from "@/lib/constants";

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "Blob deposu yapılandırılmamış." }, { status: 503 });
  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await getCurrentUser();
        if (!user) throw new Error("Bu işlem için giriş yapmalısınız.");
        const payload = clientPayload ? (JSON.parse(clientPayload) as { noteId?: string }) : null;
        if (!payload?.noteId || !pathname.startsWith(`notes/${payload.noteId}/`)) throw new Error("Geçersiz yükleme yolu.");
        const note = await db.note.findFirst({
          where: { id: payload.noteId, authorId: user.id, status: "DRAFT" },
          select: { id: true, _count: { select: { assets: true } } },
        });
        if (!note) throw new Error("Yükleme taslağı bulunamadı.");
        if (note._count.assets >= MAX_NOTE_FILES) throw new Error("Dosya sınırına ulaştınız.");
        return {
          allowedContentTypes: [...ALLOWED_UPLOAD_TYPES],
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ noteId: note.id, userId: user.id }),
        };
      },
      onUploadCompleted: async () => undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Yükleme başlatılamadı." }, { status: 400 });
  }
}
