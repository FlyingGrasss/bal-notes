import type { SubmissionStatus } from "@prisma/client";
import { Suspense } from "react";
import { AdminDashboard } from "@/components/admin-dashboard";
import { requireAdmin } from "@/lib/auth";
import { getAdminData } from "@/lib/data";

export const metadata = { title: "Yönetim", robots: { index: false, follow: false } };

export default function AdminPage({ searchParams }: { searchParams: Promise<{ durum?: string }> }) {
  return <Suspense fallback={<div className="container-shell py-10"><div className="paper-card min-h-96 animate-pulse" /></div>}><AdminPageContent searchParams={searchParams} /></Suspense>;
}

async function AdminPageContent({ searchParams }: { searchParams: Promise<{ durum?: string }> }) {
  await requireAdmin();
  const { durum } = await searchParams;
  const status = (["PENDING", "APPROVED", "REJECTED"] as SubmissionStatus[]).includes(durum as SubmissionStatus) ? durum as SubmissionStatus : "PENDING";
  const data = await getAdminData(status);
  return <div className="container-shell py-10 sm:py-14"><div className="mb-7"><p className="eyebrow">Yönetim merkezi</p><h1 className="section-title mt-2 text-4xl">BAL Notes yönetimi</h1><p className="mt-3 text-muted">İçerikleri incele, ders listesini düzenle ve topluluk güvenliğini yönet.</p></div><AdminDashboard status={status} notes={data.notes.map((note) => ({ id: note.id, title: note.title, description: note.description, gradeLevel: note.gradeLevel, subjectName: note.subject?.name || null, customSubject: note.customSubject, status: note.status, rejectionReason: note.rejectionReason, isRecommended: note.isRecommended, author: note.author, assets: note.assets.map(({ id, contentType, originalName }) => ({ id, contentType, originalName })), updatedAt: note.updatedAt.toISOString() }))} quotes={data.quotes.map((quote) => ({ id: quote.id, teacherName: quote.teacherName, quote: quote.quote, context: quote.context, gradeLevel: quote.gradeLevel, subjectName: quote.subject?.name || null, status: quote.status, rejectionReason: quote.rejectionReason, author: quote.author, updatedAt: quote.updatedAt.toISOString() }))} subjects={data.subjects.map(({ id, name, gradeLevel, sortOrder, isActive }) => ({ id, name, gradeLevel, sortOrder, isActive }))} users={data.users.map((user) => ({ id: user.id, email: user.email, name: user.name, picture: user.picture, status: user.status, banReason: user.banReason, createdAt: user.createdAt.toISOString(), noteCount: user._count.notes, quoteCount: user._count.teacherQuotes }))} homeworkWriters={data.writers} homework={data.homework.map(({ id, title, description, subject, dueText, dueDate, writer, updatedAt }) => ({ id, title, description, subject, dueText, dueDate, writer, updatedAt }))} counts={data.counts} /></div>;
}
