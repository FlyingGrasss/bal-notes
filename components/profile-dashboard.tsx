"use client";

import type { GradeLevel, SubmissionStatus } from "@prisma/client";
import { upload } from "@vercel/blob/client";
import { Edit3, ExternalLink, FileUp, LogOut, Share2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { attachNoteAsset, deleteOwnNote, deleteOwnTeacherQuote, finalizeNote, updateNote, updateTeacherQuote } from "@/actions/notes";
import { GRADE_LABELS, GRADE_OPTIONS, STATUS_LABELS } from "@/lib/constants";
import { formatDate, sanitizeFilename } from "@/lib/utils";
import { Button, buttonStyles } from "@/components/ui/button";
import { ConfirmDialog, Dialog, DialogContent } from "@/components/ui/dialog";
import { ShareDialog } from "@/components/share-dialog";

type SubjectOption = { id: string; name: string; gradeLevel: GradeLevel };
type ProfileNote = {
  id: string; title: string; description: string | null; gradeLevel: GradeLevel; subjectId: string | null; customSubject: string | null;
  status: SubmissionStatus; rejectionReason: string | null; updatedAt: string; assetCount: number; subjectName: string | null;
};
type ProfileQuote = { id: string; teacherName: string; quote: string; context: string | null; gradeLevel: GradeLevel | null; status: SubmissionStatus; rejectionReason: string | null; updatedAt: string };

export function ProfileDashboard({ notes, quotes, subjects }: { notes: ProfileNote[]; quotes: ProfileQuote[]; subjects: SubjectOption[] }) {
  return (
    <div className="space-y-10">
      <section><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">Notlarım <span className="text-muted">({notes.length})</span></h2><Link href="/paylas" className={buttonStyles({ size: "sm" })}>Yeni Not</Link></div><div className="space-y-3">{notes.length ? notes.map((note) => <NoteRow key={note.id} note={note} subjects={subjects} />) : <EmptyCopy>Henüz not paylaşmadın.</EmptyCopy>}</div></section>
      <section><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">Gönderdiğim Sözler <span className="text-muted">({quotes.length})</span></h2></div><div className="space-y-3">{quotes.length ? quotes.map((quote) => <QuoteRow key={quote.id} quote={quote} />) : <EmptyCopy>Henüz öğretmen sözü göndermedin.</EmptyCopy>}</div></section>
      <div className="border-t border-line pt-6"><a href="/auth/cikis" className={buttonStyles({ variant: "outline" })}><LogOut size={17} /> Çıkış Yap</a></div>
    </div>
  );
}

function NoteRow({ note, subjects }: { note: ProfileNote; subjects: SubjectOption[] }) {
  return (
    <article className="paper-card p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0"><div className="flex flex-wrap gap-2"><StatusBadge status={note.status} /><span className="rounded-full bg-bal-soft px-2.5 py-1 text-[10px] font-black uppercase text-bal">{GRADE_LABELS[note.gradeLevel]} · {note.subjectName || note.customSubject || "Diğer"}</span></div><h3 className="mt-3 truncate text-lg font-black">{note.title}</h3><p className="mt-1 text-xs text-muted">{note.assetCount} dosya · {formatDate(note.updatedAt)}</p>{note.rejectionReason ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800"><strong>Yönetici notu:</strong> {note.rejectionReason}</p> : null}{note.status === "DRAFT" ? <p className="mt-3 text-xs text-warning">Yükleme tamamlanmamış. Devam edebilir veya taslağı silebilirsin.</p> : null}</div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {note.status === "DRAFT" ? <ResumeDraft note={note} /> : <><Link href={`/notlar/${note.id}`} className={buttonStyles({ variant: "outline", size: "sm" })}><ExternalLink size={15} /> Aç</Link><ShareDialog noteId={note.id} title={note.title} trigger={<><Share2 size={15} /> Paylaş</>} /></>}
          <EditNote note={note} subjects={subjects} />
          <DeleteNote noteId={note.id} title={note.title} />
        </div>
      </div>
    </article>
  );
}

function EditNote({ note, subjects }: { note: ProfileNote; subjects: SubjectOption[] }) {
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState(note.gradeLevel);
  const [subject, setSubject] = useState(note.subjectId || "OTHER");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateNote(note.id, { title: String(data.get("title") || ""), description: String(data.get("description") || ""), gradeLevel: grade, subjectId: subject === "OTHER" ? null : subject, customSubject: subject === "OTHER" ? String(data.get("customSubject") || "") : null });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Not güncellendi ve yeniden incelemeye gönderildi."); setOpen(false); router.refresh();
    });
  }
  const options = subjects.filter((item) => item.gradeLevel === grade);
  return <Dialog open={open} onOpenChange={setOpen}><Button variant="ghost" size="sm" onClick={() => setOpen(true)}><Edit3 size={15} /> Düzenle</Button><DialogContent title="Notu düzenle" description="Kaydettiğinde not tekrar incelemeye alınır; doğrudan bağlantısı çalışmaya devam eder."><form onSubmit={submit} className="space-y-4"><div><label className="label">Başlık</label><input className="field" name="title" defaultValue={note.title} required minLength={5} maxLength={120} /></div><div><label className="label">Açıklama</label><textarea className="field" name="description" defaultValue={note.description || ""} maxLength={2000} /></div><div className="grid grid-cols-2 gap-3"><div><label className="label">Sınıf</label><select className="field" value={grade} onChange={(e) => { setGrade(e.target.value as GradeLevel); setSubject("OTHER"); }}>{GRADE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div><div><label className="label">Ders</label><select className="field" value={subject} onChange={(e) => setSubject(e.target.value)}>{options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}<option value="OTHER">Diğer</option></select></div></div>{subject === "OTHER" ? <div><label className="label">Ders adı</label><input className="field" name="customSubject" defaultValue={note.customSubject || ""} required minLength={2} maxLength={60} /></div> : null}<Button type="submit" disabled={pending} className="w-full">{pending ? "Kaydediliyor…" : "Kaydet ve İncelemeye Gönder"}</Button></form></DialogContent></Dialog>;
}

function ResumeDraft({ note }: { note: ProfileNote }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [shared, setShared] = useState(false);
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const files = Array.from((form.elements.namedItem("files") as HTMLInputElement).files || []);
    if (!files.length && note.assetCount === 0) return toast.error("En az bir dosya seçin.");
    setPending(true);
    try {
      for (const file of files) {
        const blob = await upload(`notes/${note.id}/${sanitizeFilename(file.name)}`, file, { access: "private", handleUploadUrl: "/api/uploads", clientPayload: JSON.stringify({ noteId: note.id }), multipart: file.size > 5 * 1024 * 1024 });
        const result = await attachNoteAsset(note.id, { pathname: blob.pathname, url: blob.url }, file.name);
        if (!result.success) throw new Error(result.error);
      }
      const result = await finalizeNote(note.id); if (!result.success) throw new Error(result.error);
      setOpen(false); setShared(true); router.refresh(); toast.success("Notun bağlantısı hazır!");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Taslak tamamlanamadı."); } finally { setPending(false); }
  }
  return <><Dialog open={open} onOpenChange={setOpen}><Button size="sm" onClick={() => setOpen(true)}><FileUp size={15} /> Devam Et</Button><DialogContent title="Yüklemeye devam et" description={`${note.assetCount} dosya taslakta kayıtlı. Yeni dosya ekleyebilir veya mevcut dosyalarla gönderebilirsin.`}><form onSubmit={submit}><input className="field" type="file" name="files" accept="application/pdf,image/jpeg,image/png,image/webp" multiple /><Button type="submit" disabled={pending} className="mt-4 w-full">{pending ? "Tamamlanıyor…" : "Notu Gönder"}</Button></form></DialogContent></Dialog>{shared ? <ShareDialog noteId={note.id} title={note.title} autoOpen /> : null}</>;
}

function DeleteNote({ noteId, title }: { noteId: string; title: string }) {
  const [open, setOpen] = useState(false); const [pending, startTransition] = useTransition(); const router = useRouter();
  return <><Button variant="ghost" size="icon" aria-label="Notu sil" onClick={() => setOpen(true)}><Trash2 size={16} /></Button><ConfirmDialog open={open} onOpenChange={setOpen} title="Notu kalıcı olarak sil" description={<><strong>{title}</strong> ve tüm dosyaları kalıcı olarak kaldırılacak.</>} confirmLabel="Notu Sil" pending={pending} onConfirm={() => startTransition(async () => { const result = await deleteOwnNote(noteId); if (!result.success) { toast.error(result.error); return; } toast.success("Not silindi."); setOpen(false); router.refresh(); })} /></>;
}

function QuoteRow({ quote }: { quote: ProfileQuote }) {
  const [editOpen, setEditOpen] = useState(false); const [deleteOpen, setDeleteOpen] = useState(false); const [pending, startTransition] = useTransition(); const router = useRouter();
  function edit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(async () => { const grade = String(data.get("gradeLevel") || ""); const result = await updateTeacherQuote(quote.id, { teacherName: String(data.get("teacherName") || ""), quote: String(data.get("quote") || ""), context: String(data.get("context") || ""), gradeLevel: grade ? grade as GradeLevel : null }); if (!result.success) { toast.error(result.error); return; } toast.success("Söz yeniden incelemeye gönderildi."); setEditOpen(false); router.refresh(); }); }
  return <article className="paper-card p-4 sm:p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><StatusBadge status={quote.status} /><blockquote className="mt-3 text-lg font-black">“{quote.quote}”</blockquote><p className="mt-2 text-xs text-muted">— {quote.teacherName} · {formatDate(quote.updatedAt)}</p>{quote.rejectionReason ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"><strong>Yönetici notu:</strong> {quote.rejectionReason}</p> : null}</div><div className="flex shrink-0 gap-2"><Dialog open={editOpen} onOpenChange={setEditOpen}><Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}><Edit3 size={15} /> Düzenle</Button><DialogContent title="Sözü düzenle"><form onSubmit={edit} className="space-y-4"><div><label className="label">Öğretmen</label><input className="field" name="teacherName" defaultValue={quote.teacherName} required /></div><div><label className="label">Söz</label><textarea className="field" name="quote" defaultValue={quote.quote} required maxLength={280} /></div><div><label className="label">Bağlam</label><input className="field" name="context" defaultValue={quote.context || ""} /></div><div><label className="label">Sınıf</label><select className="field" name="gradeLevel" defaultValue={quote.gradeLevel || ""}><option value="">Belirtme</option>{GRADE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div><Button className="w-full" type="submit" disabled={pending}>Kaydet</Button></form></DialogContent></Dialog><Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)} aria-label="Sözü sil"><Trash2 size={16} /></Button><ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Sözü sil" description="Bu öğretmen sözü kalıcı olarak kaldırılacak." confirmLabel="Sözü Sil" pending={pending} onConfirm={() => startTransition(async () => { const result = await deleteOwnTeacherQuote(quote.id); if (!result.success) { toast.error(result.error); return; } setDeleteOpen(false); router.refresh(); })} /></div></div></article>;
}

function StatusBadge({ status }: { status: SubmissionStatus }) { const colors = { DRAFT: "bg-gray-100 text-gray-700", PENDING: "bg-amber-100 text-amber-800", APPROVED: "bg-emerald-100 text-emerald-800", REJECTED: "bg-red-100 text-red-800" }; return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${colors[status]}`}>{STATUS_LABELS[status]}</span>; }
function EmptyCopy({ children }: { children: React.ReactNode }) { return <div className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">{children}</div>; }
