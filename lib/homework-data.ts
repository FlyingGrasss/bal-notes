import "server-only";

import { db } from "@/lib/db";
import { getCurrentHomeworkWriter, type HomeworkWriterDto } from "@/lib/homework-auth";
import { formatHomeworkDate } from "@/lib/homework-display";
import type { HomeworkDto } from "@/lib/homework-types";

function toDateOnly(value: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(value);
}

export async function getPublicHomework() {
  const homework = await db.homework.findMany({
    include: { writer: { select: { id: true, name: true, kind: true } } },
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
  });
  const mapped = homework.map((item): HomeworkDto => ({
    id: item.id,
    title: item.title,
    description: item.description,
    subject: item.subject,
    dueDate: toDateOnly(item.dueDate),
    writer: item.writer,
    updatedAt: item.updatedAt.toISOString(),
  }));
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
  return mapped.sort((left, right) => {
    const leftPast = left.dueDate < today;
    const rightPast = right.dueDate < today;
    if (leftPast !== rightPast) return leftPast ? 1 : -1;
    if (leftPast) return right.dueDate.localeCompare(left.dueDate) || right.updatedAt.localeCompare(left.updatedAt);
    return left.dueDate.localeCompare(right.dueDate) || right.updatedAt.localeCompare(left.updatedAt);
  });
}

export async function getHomeworkPageData() {
  const [homework, writer] = await Promise.all([getPublicHomework(), getCurrentHomeworkWriter()]);
  const ownHomework = writer
    ? homework.filter((item) => item.writer.id === writer.id)
    : [];
  return { homework, writer, ownHomework };
}

export async function getHomeworkAdminData() {
  const [writers, homework] = await Promise.all([
    db.homeworkWriter.findMany({
      select: { id: true, name: true, kind: true, fixedSubject: true, isActive: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    db.homework.findMany({
      include: { writer: { select: { id: true, name: true, kind: true } } },
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
      take: 200,
    }),
  ]);
  return {
    writers: writers.map((writer) => ({ ...writer, lastLoginAt: writer.lastLoginAt?.toISOString() ?? null, createdAt: writer.createdAt.toISOString() })),
    homework: homework.map((item) => ({ ...item, dueDate: toDateOnly(item.dueDate), updatedAt: item.updatedAt.toISOString() })),
  };
}

export type HomeworkPageWriter = HomeworkWriterDto;

export { formatHomeworkDate };
