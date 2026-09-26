"use client";

import * as Tabs from "@radix-ui/react-tabs";
import type { GradeLevel } from "@prisma/client";
import { upload } from "@vercel/blob/client";
import { BookUp, FileImage, Quote, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { attachNoteAsset, createNoteDraft, createTeacherQuote, finalizeNote } from "@/actions/notes";
import { GRADE_OPTIONS, MAX_FILE_SIZE, MAX_NOTE_FILES, MAX_NOTE_SIZE } from "@/lib/constants";
import { sanitizeFilename } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/share-dialog";

type SubjectOption = { id: string; name: string; gradeLevel: GradeLevel };

export function SubmissionForms({ subjects }: { subjects: SubjectOption[] }) {
  const [sharedNote, setSharedNote] = useState<{ id: string; title: string } | null>(null);
  return (
    <>
      <Tabs.Root defaultValue="note" className="paper-card overflow-hidden">
        <Tabs.List className="grid grid-cols-2 border-b border-line bg-paper-deep/60 p-2" aria-label="Paylaşım türü">
          <Tabs.Trigger value="note" className="flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-black text-muted data-[state=active]:bg-white data-[state=active]:text-bal data-[state=active]:shadow-sm"><BookUp size={18} /> Not Paylaş</Tabs.Trigger>
          <Tabs.Trigger value="quote" className="flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-black text-muted data-[state=active]:bg-white data-[state=active]:text-bal data-[state=active]:shadow-sm"><Quote size={18} /> Öğretmen Sözü</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="note" className="p-5 sm:p-8"><NoteForm subjects={subjects} onCreated={(id, title) => setSharedNote({ id, title })} /></Tabs.Content>
        <Tabs.Content value="quote" className="p-5 sm:p-8"><QuoteForm /></Tabs.Content>
      </Tabs.Root>
      {sharedNote ? <ShareDialog key={sharedNote.id} noteId={sharedNote.id} title={sharedNote.title} autoOpen /> : null}
    </>
  );
}

function NoteForm({ subjects, onCreated }: { subjects: SubjectOption[]; onCreated: (id: string, title: string) => void }) {
  const [grade, setGrade] = useState<GradeLevel>("PREP");
  const [subject, setSubject] = useState("");
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState("");
  const filteredSubjects = useMemo(() => subjects.filter((item) => item.gradeLevel === grade), [grade, subjects]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const files = Array.from((form.elements.namedItem("files") as HTMLInputElement).files || []);
    const title = String(data.get("title") || "");
    if (!files.length) return toast.error("En az bir fotoğraf veya PDF ekleyin.");
    if (files.length > MAX_NOTE_FILES) return toast.error("En fazla 10 dosya yükleyebilirsiniz.");
    if (files.some((file) => file.size > MAX_FILE_SIZE)) return toast.error("Her dosya en fazla 15 MB olabilir.");
    if (files.reduce((sum, file) => sum + file.size, 0) > MAX_NOTE_SIZE) return toast.error("Toplam dosya boyutu en fazla 60 MB olabilir.");
    if (!subject) return toast.error("Bir ders seçin.");

    setPending(true);
    setProgress("Taslak hazırlanıyor…");
    try {
      const draft = await createNoteDraft({
        title,
        description: String(data.get("description") || ""),
        gradeLevel: grade,
        subjectId: subject === "OTHER" ? null : subject,
        customSubject: subject === "OTHER" ? String(data.get("customSubject") || "") : null,
      });
      if (!draft.success) return toast.error(draft.error);

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setProgress(`${index + 1}/${files.length} dosya yükleniyor…`);
        const blob = await upload(`notes/${draft.data.noteId}/${sanitizeFilename(file.name)}`, file, {
          access: "private",
          handleUploadUrl: "/api/uploads",
          clientPayload: JSON.stringify({ noteId: draft.data.noteId }),
          multipart: file.size > 5 * 1024 * 1024,
        });
        const attached = await attachNoteAsset(draft.data.noteId, { pathname: blob.pathname, url: blob.url }, file.name);
        if (!attached.success) throw new Error(attached.error);
      }
      setProgress("Not yayına hazırlanıyor…");
      const result = await finalizeNote(draft.data.noteId);
      if (!result.success) throw new Error(result.error);
      form.reset();
      setGrade("PREP");
      setSubject("");
      toast.success("Notun bağlantısı hazır!");
      onCreated(result.data.noteId, title);
    } catch (error) {
      toast.error(error instanceof Error ? `${error.message} Taslağı profilinden yönetebilirsin.` : "Not yüklenemedi.");
    } finally {
      setPending(false);
      setProgress("");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div><h2 className="text-2xl font-black tracking-tight">Ders notunu yükle</h2><p className="mt-2 text-sm leading-6 text-muted">Gönderdiğin anda paylaşılabilir bağlantın oluşur. Keşfette görünmesi için inceleme gerekir.</p></div>
      <div><label className="label" htmlFor="title">Başlık</label><input className="field" id="title" name="title" minLength={5} maxLength={120} required placeholder="Örn. Trigonometri son tekrar notları" /></div>
      <div><label className="label" htmlFor="description">Açıklama <span className="normal-case font-medium tracking-normal text-muted">(isteğe bağlı)</span></label><textarea className="field" id="description" name="description" maxLength={2000} placeholder="Notun hangi konuları kapsadığını kısaca anlat…" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="grade">Sınıf</label><select className="field" id="grade" value={grade} onChange={(event) => { setGrade(event.target.value as GradeLevel); setSubject(""); }}>{GRADE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        <div><label className="label" htmlFor="subject">Ders</label><select className="field" id="subject" value={subject} required onChange={(event) => setSubject(event.target.value)}><option value="">Ders seç…</option>{filteredSubjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}<option value="OTHER">Diğer</option></select></div>
      </div>
      {subject === "OTHER" ? <div><label className="label" htmlFor="customSubject">Ders adı</label><input className="field" id="customSubject" name="customSubject" minLength={2} maxLength={60} required placeholder="Paylaşılan listeye eklenmez" /></div> : null}
      <div><label className="label" htmlFor="files">Fotoğraflar veya PDF</label><label className="flex min-h-36 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-bal/20 bg-bal-soft/35 p-5 text-center hover:border-bal/45"><FileImage className="text-bal" size={28} /><span className="mt-3 text-sm font-black">Dosyaları seç</span><span className="mt-1 text-xs leading-5 text-muted">PDF, JPG, PNG veya WebP · En fazla 10 dosya · Toplam 60 MB</span><input className="mt-4 block max-w-full text-xs" id="files" name="files" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple required /></label></div>
      <Button type="submit" size="lg" disabled={pending} className="w-full"><Send size={18} /> {pending ? progress || "Yükleniyor…" : "Notu Paylaş"}</Button>
    </form>
  );
}

function QuoteForm() {
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    const grade = String(data.get("gradeLevel") || "");
    const result = await createTeacherQuote({
      teacherName: String(data.get("teacherName") || ""),
      quote: String(data.get("quote") || ""),
      context: String(data.get("context") || ""),
      gradeLevel: grade ? (grade as GradeLevel) : null,
    });
    setPending(false);
    if (!result.success) return toast.error(result.error);
    form.reset();
    toast.success("Söz incelemeye gönderildi.");
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <div><h2 className="text-2xl font-black tracking-tight">Unutulmayan bir söz ekle</h2><p className="mt-2 text-sm leading-6 text-muted">Kısa, bağlamı anlaşılır ve gerçekten söylenmiş sözleri paylaş.</p></div>
      <div><label className="label" htmlFor="teacherName">Öğretmen</label><input className="field" id="teacherName" name="teacherName" required minLength={2} maxLength={80} placeholder="Örn. Fatih Hoca" /></div>
      <div><label className="label" htmlFor="quote">Söylediği söz</label><textarea className="field text-lg font-bold" id="quote" name="quote" required minLength={5} maxLength={280} placeholder="3.3 ezber olur" /></div>
      <div><label className="label" htmlFor="context">Bağlam <span className="normal-case font-medium tracking-normal text-muted">(isteğe bağlı)</span></label><input className="field" id="context" name="context" maxLength={300} placeholder="Örn. Trigonometri işlerken" /></div>
      <div><label className="label" htmlFor="quoteGrade">Sınıf <span className="normal-case font-medium tracking-normal text-muted">(isteğe bağlı)</span></label><select className="field" id="quoteGrade" name="gradeLevel"><option value="">Belirtme</option>{GRADE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      <Button type="submit" size="lg" disabled={pending} className="w-full"><Quote size={18} /> {pending ? "Gönderiliyor…" : "Sözü İncelemeye Gönder"}</Button>
    </form>
  );
}
