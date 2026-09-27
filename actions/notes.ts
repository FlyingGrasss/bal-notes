"use server";

import { del, head } from "@vercel/blob";
import { revalidatePath, updateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_NOTE_FILES,
  MAX_NOTE_SIZE,
  MAX_PENDING_SUBMISSIONS,
} from "@/lib/constants";
import { firstZodError, noteInputSchema, quoteInputSchema, type NoteInput, type QuoteInput } from "@/lib/validation";
import { CACHE_TAGS } from "@/lib/cache-tags";

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

async function validateNoteSubject(input: NoteInput) {
  if (!input.subjectId) return true;
  const subject = await db.subject.findFirst({
    where: { id: input.subjectId, gradeLevel: input.gradeLevel, isActive: true },
    select: { id: true },
  });
  return Boolean(subject);
}

async function validateQuoteSubject(input: QuoteInput) {
  if (!input.subjectId) return true;
  const subject = await db.subject.findFirst({
    where: {
      id: input.subjectId,
      isActive: true,
      ...(input.gradeLevel ? { gradeLevel: input.gradeLevel } : {}),
    },
    select: { id: true },
  });
  return Boolean(subject);
}

async function pendingSubmissionCount(userId: string) {
  const [notes, quotes] = await Promise.all([
    db.note.count({ where: { authorId: userId, status: "PENDING" } }),
    db.teacherQuote.count({ where: { authorId: userId, status: "PENDING" } }),
  ]);
  return notes + quotes;
}

export async function createNoteDraft(rawInput: NoteInput): Promise<ActionResult<{ noteId: string }>> {
  const user = await requireUser("/paylas");
  const parsed = noteInputSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: firstZodError(parsed.error) };
  if (!(await validateNoteSubject(parsed.data))) {
    return { success: false, error: "Seçtiğiniz ders bu sınıf için kullanılamıyor." };
  }
  if ((await pendingSubmissionCount(user.id)) >= MAX_PENDING_SUBMISSIONS) {
    return { success: false, error: "Aynı anda en fazla 5 gönderiniz incelemede olabilir." };
  }

  const note = await db.note.create({
    data: {
      authorId: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      gradeLevel: parsed.data.gradeLevel,
      subjectId: parsed.data.subjectId || null,
      customSubject: parsed.data.customSubject || null,
      status: "DRAFT",
    },
    select: { id: true },
  });
  revalidatePath("/profil");
  return { success: true, data: { noteId: note.id } };
}

export async function attachNoteAsset(
  noteId: string,
  blob: { pathname: string; url: string },
  originalName: string,
): Promise<ActionResult<{ assetId: string }>> {
  const user = await requireUser("/paylas");
  const note = await db.note.findFirst({
    where: { id: noteId, authorId: user.id, status: "DRAFT" },
    include: { assets: true },
  });
  if (!note) return { success: false, error: "Yükleme taslağı bulunamadı." };
  if (note.assets.length >= MAX_NOTE_FILES) return { success: false, error: "En fazla 10 dosya yükleyebilirsiniz." };
  if (!blob.pathname.startsWith(`notes/${note.id}/`)) {
    return { success: false, error: "Dosya yolu bu nota ait değil." };
  }

  try {
    const metadata = await head(blob.pathname);
    if (metadata.url !== blob.url || !ALLOWED_UPLOAD_TYPES.includes(metadata.contentType as (typeof ALLOWED_UPLOAD_TYPES)[number])) {
      return { success: false, error: "Dosya türü desteklenmiyor." };
    }
    const total = note.assets.reduce((sum, asset) => sum + asset.size, 0) + metadata.size;
    if (total > MAX_NOTE_SIZE) return { success: false, error: "Not başına toplam dosya sınırı 60 MB." };

    const asset = await db.noteAsset.create({
      data: {
        noteId,
        blobUrl: metadata.url,
        pathname: metadata.pathname,
        originalName: originalName.slice(0, 180),
        contentType: metadata.contentType,
        size: metadata.size,
        sortOrder: note.assets.length,
      },
      select: { id: true },
    });
    return { success: true, data: { assetId: asset.id } };
  } catch {
    return { success: false, error: "Yüklenen dosya doğrulanamadı." };
  }
}

export async function finalizeNote(noteId: string): Promise<ActionResult<{ noteId: string }>> {
  const user = await requireUser("/paylas");
  const note = await db.note.findFirst({
    where: { id: noteId, authorId: user.id, status: "DRAFT" },
    include: { assets: true },
  });
  if (!note) return { success: false, error: "Taslak bulunamadı." };
  if (note.assets.length === 0) return { success: false, error: "En az bir fotoğraf veya PDF ekleyin." };
  if ((await pendingSubmissionCount(user.id)) >= MAX_PENDING_SUBMISSIONS) {
    return { success: false, error: "Aynı anda en fazla 5 gönderiniz incelemede olabilir." };
  }

  await db.note.update({
    where: { id: note.id },
    data: { status: "PENDING", submittedAt: new Date() },
  });
  updateTag(CACHE_TAGS.notes);
  revalidatePath("/", "page");
  revalidatePath("/notlar", "page");
  revalidatePath("/notlar/filtre", "page");
  revalidatePath("/profil", "page");
  revalidatePath(`/notlar/${note.id}`, "page");
  return { success: true, data: { noteId: note.id } };
}

export async function updateNote(noteId: string, rawInput: NoteInput): Promise<ActionResult> {
  const user = await requireUser("/profil");
  const parsed = noteInputSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: firstZodError(parsed.error) };
  if (!(await validateNoteSubject(parsed.data))) return { success: false, error: "Bu ders ilgili sınıf için etkin değil." };

  const note = await db.note.findFirst({
    where: { id: noteId, authorId: user.id },
    select: { id: true, status: true, _count: { select: { assets: true } } },
  });
  if (!note) return { success: false, error: "Not bulunamadı." };
  if (note._count.assets === 0) {
    return { success: false, error: "Notu incelemeye göndermeden önce en az bir dosya ekleyin." };
  }
  if (note.status !== "PENDING" && (await pendingSubmissionCount(user.id)) >= MAX_PENDING_SUBMISSIONS) {
    return { success: false, error: "Aynı anda en fazla 5 gönderiniz incelemede olabilir." };
  }
  await db.note.update({
    where: { id: note.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      gradeLevel: parsed.data.gradeLevel,
      subjectId: parsed.data.subjectId || null,
      customSubject: parsed.data.customSubject || null,
      status: "PENDING",
      submittedAt: new Date(),
      rejectionReason: null,
      reviewedAt: null,
      reviewedById: null,
      publishedAt: null,
      isRecommended: false,
      recommendedAt: null,
    },
  });
  updateTag(CACHE_TAGS.notes);
  revalidatePath("/", "page");
  revalidatePath("/notlar", "page");
  revalidatePath("/notlar/filtre", "page");
  revalidatePath("/profil", "page");
  revalidatePath(`/notlar/${note.id}`, "page");
  return { success: true, data: undefined };
}

export async function deleteOwnNote(noteId: string): Promise<ActionResult> {
  const user = await requireUser("/profil");
  const note = await db.note.findFirst({
    where: { id: noteId, authorId: user.id },
    include: { assets: { select: { pathname: true } } },
  });
  if (!note) return { success: false, error: "Not bulunamadı." };
  await db.note.delete({ where: { id: note.id } });
  updateTag(CACHE_TAGS.notes);
  if (note.assets.length) void del(note.assets.map((asset) => asset.pathname)).catch(console.error);
  revalidatePath("/", "page");
  revalidatePath("/notlar", "page");
  revalidatePath("/notlar/filtre", "page");
  revalidatePath("/profil", "page");
  return { success: true, data: undefined };
}

export async function toggleVote(noteId: string): Promise<ActionResult<{ voted: boolean; count: number }>> {
  const user = await requireUser(`/notlar/${noteId}`);
  const note = await db.note.findFirst({ where: { id: noteId, status: { not: "DRAFT" } }, select: { id: true } });
  if (!note) return { success: false, error: "Not bulunamadı." };
  const existing = await db.noteVote.findUnique({ where: { noteId_userId: { noteId, userId: user.id } } });
  if (existing) await db.noteVote.delete({ where: { id: existing.id } });
  else await db.noteVote.create({ data: { noteId, userId: user.id } });
  const count = await db.noteVote.count({ where: { noteId } });
  updateTag(CACHE_TAGS.notes);
  revalidatePath("/", "page");
  revalidatePath("/notlar", "page");
  revalidatePath("/notlar/filtre", "page");
  revalidatePath(`/notlar/${noteId}`, "page");
  return { success: true, data: { voted: !existing, count } };
}

export async function createTeacherQuote(rawInput: QuoteInput): Promise<ActionResult<{ quoteId: string }>> {
  const user = await requireUser("/paylas");
  const parsed = quoteInputSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: firstZodError(parsed.error) };
  if (!(await validateQuoteSubject(parsed.data))) return { success: false, error: "Seçtiğiniz ders bu sınıf için kullanılamıyor." };
  if ((await pendingSubmissionCount(user.id)) >= MAX_PENDING_SUBMISSIONS) {
    return { success: false, error: "Aynı anda en fazla 5 gönderiniz incelemede olabilir." };
  }
  const quote = await db.teacherQuote.create({
    data: {
      authorId: user.id,
      teacherName: parsed.data.teacherName,
      quote: parsed.data.quote,
      context: parsed.data.context || null,
      gradeLevel: parsed.data.gradeLevel || null,
      subjectId: parsed.data.subjectId || null,
      status: "PENDING",
    },
    select: { id: true },
  });
  updateTag(CACHE_TAGS.quotes);
  revalidatePath("/profil");
  revalidatePath("/admin");
  return { success: true, data: { quoteId: quote.id } };
}

export async function updateTeacherQuote(quoteId: string, rawInput: QuoteInput): Promise<ActionResult> {
  const user = await requireUser("/profil");
  const parsed = quoteInputSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: firstZodError(parsed.error) };
  if (!(await validateQuoteSubject(parsed.data))) return { success: false, error: "Seçtiğiniz ders bu sınıf için kullanılamıyor." };
  const quote = await db.teacherQuote.findFirst({
    where: { id: quoteId, authorId: user.id },
    select: { id: true, status: true },
  });
  if (!quote) return { success: false, error: "Söz bulunamadı." };
  if (quote.status !== "PENDING" && (await pendingSubmissionCount(user.id)) >= MAX_PENDING_SUBMISSIONS) {
    return { success: false, error: "Aynı anda en fazla 5 gönderiniz incelemede olabilir." };
  }
  await db.teacherQuote.update({
    where: { id: quote.id },
    data: { teacherName: parsed.data.teacherName, quote: parsed.data.quote, context: parsed.data.context || null, gradeLevel: parsed.data.gradeLevel || null, subjectId: parsed.data.subjectId || null, status: "PENDING", rejectionReason: null, reviewedAt: null, reviewedById: null, publishedAt: null },
  });
  updateTag(CACHE_TAGS.quotes);
  revalidatePath("/profil");
  revalidatePath("/sozler");
  return { success: true, data: undefined };
}

export async function deleteOwnTeacherQuote(quoteId: string): Promise<ActionResult> {
  const user = await requireUser("/profil");
  const result = await db.teacherQuote.deleteMany({ where: { id: quoteId, authorId: user.id } });
  if (!result.count) return { success: false, error: "Söz bulunamadı." };
  updateTag(CACHE_TAGS.quotes);
  revalidatePath("/profil");
  revalidatePath("/sozler");
  return { success: true, data: undefined };
}
