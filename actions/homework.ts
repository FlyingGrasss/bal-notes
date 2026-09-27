"use server";

import QRCode from "qrcode";
import { revalidatePath, updateTag } from "next/cache";
import { homeworkAppUrl } from "@/lib/utils";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { firstZodError, homeworkInputSchema, homeworkWriterInputSchema, type HomeworkInput, type HomeworkWriterInput } from "@/lib/validation";
import { createHomeworkToken, hashHomeworkToken } from "@/lib/homework-security";
import { clearHomeworkLoginRateLimit, consumeHomeworkLoginAttempt, destroyHomeworkSession, establishHomeworkSession, getHomeworkAuth, getCurrentHomeworkWriter } from "@/lib/homework-auth";
import { dateOnlyToDate } from "@/lib/homework-display";
import type { HomeworkSubjectValue } from "@/lib/homework-types";
import type { ActionResult } from "@/actions/notes";
import { CACHE_TAGS } from "@/lib/cache-tags";

type CredentialData = {
  writer: { id: string; name: string; kind: "TEACHER" | "SMART_BOARD"; fixedSubject: HomeworkSubjectValue | null };
  loginUrl: string;
  qrDataUrl: string;
};

function writerCredential(rawKey: string, writer: CredentialData["writer"]): Promise<CredentialData> {
  const loginUrl = homeworkAppUrl(`/login?anahtar=${encodeURIComponent(rawKey)}`);
  return QRCode.toDataURL(loginUrl, { margin: 1, width: 320 }).then((qrDataUrl) => ({ writer, loginUrl, qrDataUrl }));
}

function refreshHomework() {
  updateTag(CACHE_TAGS.homework);
  revalidatePath("/", "page");
  revalidatePath("/odevler", "page");
  revalidatePath("/odevler/panel", "page");
  revalidatePath("/login", "page");
  revalidatePath("/admin", "page");
}

async function canManageHomework(homeworkId: string) {
  const auth = await getHomeworkAuth();
  if (!auth.writer && !auth.isAdmin) return null;
  const homework = await db.homework.findUnique({ where: { id: homeworkId }, select: { id: true, writerId: true } });
  if (!homework || (!auth.isAdmin && homework.writerId !== auth.writer?.id)) return null;
  return { auth, homework };
}

export async function loginHomeworkWriter(rawKey: string): Promise<ActionResult<{ writerId: string }>> {
  const rateLimit = await consumeHomeworkLoginAttempt();
  if (!rateLimit.allowed) return { success: false, error: "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin." };
  const key = rawKey.trim();
  if (key.length < 20 || key.length > 200) return { success: false, error: "Giriş anahtarı geçersiz." };
  const writer = await db.homeworkWriter.findFirst({
    where: { keyHash: hashHomeworkToken(key) },
    select: { id: true, name: true, kind: true, fixedSubject: true, isActive: true },
  });
  if (!writer || !writer.isActive) return { success: false, error: "Giriş anahtarı geçersiz." };
  const sessionToken = createHomeworkToken();
  await db.homeworkWriter.update({ where: { id: writer.id }, data: { lastLoginAt: new Date() } });
  await establishHomeworkSession(writer.id, sessionToken);
  await clearHomeworkLoginRateLimit(rateLimit.bucketKey);
  refreshHomework();
  return { success: true, data: { writerId: writer.id } };
}

export async function logoutHomeworkWriter(): Promise<ActionResult> {
  await destroyHomeworkSession();
  revalidatePath("/", "page");
  revalidatePath("/odevler", "page");
  return { success: true, data: undefined };
}

export async function createHomework(rawInput: HomeworkInput): Promise<ActionResult<{ homeworkId: string }>> {
  const auth = await getHomeworkAuth();
  if (!auth.writer) return { success: false, error: "Ödev paylaşmak için yazar girişi yapın." };
  const parsed = homeworkInputSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: firstZodError(parsed.error) };
  if (auth.writer.kind === "TEACHER" && auth.writer.fixedSubject !== parsed.data.subject) {
    return { success: false, error: "Bu yazar yalnızca kendi dersi için ödev paylaşabilir." };
  }
  const homework = await db.homework.create({
    data: {
      writerId: auth.writer.id,
      subject: parsed.data.subject,
      title: parsed.data.title,
      description: parsed.data.description || null,
      dueText: parsed.data.dueText,
      dueDate: dateOnlyToDate(parsed.data.dueDate),
    },
    select: { id: true },
  });
  refreshHomework();
  return { success: true, data: { homeworkId: homework.id } };
}

export async function updateHomework(homeworkId: string, rawInput: HomeworkInput): Promise<ActionResult> {
  const managed = await canManageHomework(homeworkId);
  if (!managed) return { success: false, error: "Bu ödevi düzenleme yetkiniz yok." };
  const parsed = homeworkInputSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: firstZodError(parsed.error) };
  if (managed.auth.writer?.kind === "TEACHER" && managed.auth.writer.fixedSubject !== parsed.data.subject) {
    return { success: false, error: "Bu yazar yalnızca kendi dersi için ödev paylaşabilir." };
  }
  await db.homework.update({
    where: { id: homeworkId },
    data: { subject: parsed.data.subject, title: parsed.data.title, description: parsed.data.description || null, dueText: parsed.data.dueText, dueDate: dateOnlyToDate(parsed.data.dueDate) },
  });
  refreshHomework();
  return { success: true, data: undefined };
}

export async function deleteHomework(homeworkId: string): Promise<ActionResult> {
  const managed = await canManageHomework(homeworkId);
  if (!managed) return { success: false, error: "Bu ödevi silme yetkiniz yok." };
  await db.homework.delete({ where: { id: homeworkId } });
  refreshHomework();
  return { success: true, data: undefined };
}

export async function createHomeworkWriter(rawInput: HomeworkWriterInput): Promise<ActionResult<CredentialData>> {
  await requireAdmin();
  const parsed = homeworkWriterInputSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: firstZodError(parsed.error) };
  const rawKey = createHomeworkToken();
  const writer = await db.homeworkWriter.create({
    data: { name: parsed.data.name, kind: parsed.data.kind, fixedSubject: parsed.data.fixedSubject || null, keyHash: hashHomeworkToken(rawKey) },
    select: { id: true, name: true, kind: true, fixedSubject: true, isActive: true },
  });
  refreshHomework();
  return { success: true, data: await writerCredential(rawKey, writer) };
}

export async function updateHomeworkWriter(writerId: string, rawInput: HomeworkWriterInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = homeworkWriterInputSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: firstZodError(parsed.error) };
  const result = await db.homeworkWriter.updateMany({
    where: { id: writerId },
    data: { name: parsed.data.name, kind: parsed.data.kind, fixedSubject: parsed.data.fixedSubject || null },
  });
  if (!result.count) return { success: false, error: "Yazar bulunamadı." };
  refreshHomework();
  return { success: true, data: undefined };
}

export async function rotateHomeworkWriterKey(writerId: string): Promise<ActionResult<CredentialData>> {
  await requireAdmin();
  const rawKey = createHomeworkToken();
  const writer = await db.homeworkWriter.findUnique({ where: { id: writerId }, select: { id: true, name: true, kind: true, fixedSubject: true, isActive: true } });
  if (!writer) return { success: false, error: "Yazar bulunamadı." };
  await db.$transaction([
    db.homeworkWriter.update({ where: { id: writerId }, data: { keyHash: hashHomeworkToken(rawKey) } }),
    db.homeworkWriterSession.deleteMany({ where: { writerId } }),
  ]);
  refreshHomework();
  return { success: true, data: await writerCredential(rawKey, writer) };
}

export async function setHomeworkWriterActive(writerId: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  const result = await db.homeworkWriter.updateMany({ where: { id: writerId }, data: { isActive } });
  if (!result.count) return { success: false, error: "Yazar bulunamadı." };
  if (!isActive) await db.homeworkWriterSession.deleteMany({ where: { writerId } });
  refreshHomework();
  return { success: true, data: undefined };
}

export async function deleteHomeworkWriter(writerId: string): Promise<ActionResult> {
  await requireAdmin();
  const result = await db.homeworkWriter.deleteMany({ where: { id: writerId } });
  if (!result.count) return { success: false, error: "Yazar bulunamadı." };
  refreshHomework();
  return { success: true, data: undefined };
}

export async function getLoggedInHomeworkWriter() {
  return getCurrentHomeworkWriter();
}
