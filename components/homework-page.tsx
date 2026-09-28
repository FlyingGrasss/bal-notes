"use client";

import { Atom, BookHeart, BookOpen, Brain, CalendarDays, Calculator, FlaskConical, Globe2, Landmark, Leaf, Pencil, Plus, Trash2, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { createHomework, deleteHomework, logoutHomeworkWriter, updateHomework } from "@/actions/homework";
import { HOMEWORK_SUBJECT_LABELS, HOMEWORK_SUBJECT_OPTIONS } from "@/lib/constants";
import { getHomeworkDateStatus } from "@/lib/homework-display";
import type { HomeworkDto, HomeworkSubjectValue, HomeworkWriterView } from "@/lib/homework-types";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog, DialogContent } from "@/components/ui/dialog";

const SUBJECT_ICONS: Record<HomeworkSubjectValue, LucideIcon> = {
  EDEBIYAT: BookOpen,
  MATEMATIK: Calculator,
  FIZIK: Atom,
  KIMYA: FlaskConical,
  BIYOLOJI: Leaf,
  FELSEFE: Brain,
  TARIH: Landmark,
  COGRAFYA: Globe2,
  DIN_KULTURU: BookHeart,
};

export function HomeworkPublicPage({ homework }: { homework: HomeworkDto[] }) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4">
        {homework.length ? homework.map((item) => <HomeworkCard key={item.id} item={item} />) : <div className="paper-card p-8 text-sm text-muted">Henüz paylaşılmış ödev yok.</div>}
      </div>
    </div>
  );
}

export function HomeworkWriterDashboard({ writer, homework }: { writer: HomeworkWriterView; homework: HomeworkDto[] }) {
  const router = useRouter();
  const [editItem, setEditItem] = useState<HomeworkDto | null>(null);
  const [deleteItem, setDeleteItem] = useState<HomeworkDto | null>(null);
  const [pending, startTransition] = useTransition();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
  const currentHomework = useMemo(() => homework.filter((item) => !item.dueDate || item.dueDate >= today).sort((left, right) => (left.dueDate || "9999-12-31").localeCompare(right.dueDate || "9999-12-31")), [homework, today]);
  const pastHomework = useMemo(() => homework.filter((item) => item.dueDate && item.dueDate < today).sort((left, right) => (right.dueDate || "").localeCompare(left.dueDate || "")), [homework, today]);

  function remove() {
    if (!deleteItem) return;
    startTransition(async () => {
      const result = await deleteHomework(deleteItem.id);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Ödev silindi.");
      setDeleteItem(null);
      router.refresh();
    });
  }

  function logout() {
    startTransition(async () => {
      const result = await logoutHomeworkWriter();
      if (!result.success) { toast.error(result.error); return; }
      router.push("/odevler");
      router.refresh();
    });
  }

  const subjectLabel = writer.kind === "TEACHER" ? HOMEWORK_SUBJECT_LABELS[writer.fixedSubject!] : "Tüm dersler";

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-bal p-6 text-white shadow-[0_22px_55px_rgb(162_26_42/22%)] sm:p-9">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border-[22px] border-white/10" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Ödev paneli</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Merhaba, {writer.name}</h1>
            <p className="mt-3 text-sm font-bold text-white/70">{subjectLabel} · {homework.length} paylaşım</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <HomeworkEditorDialog writer={writer} onSaved={() => router.refresh()} />
            <Button variant="outline" size="sm" onClick={logout} disabled={pending} className="border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/15">Çıkış</Button>
          </div>
        </div>
      </section>

      <HomeworkSection title="Güncel ödevler" description="Teslim tarihi en yakın olanlar üstte." items={currentHomework} onEdit={setEditItem} onDelete={setDeleteItem} empty="Güncel ödev yok." />
      <HomeworkSection title="Geçmiş ödevler" description="Daha önce paylaştığın ödevler." items={pastHomework} onEdit={setEditItem} onDelete={setDeleteItem} empty="Henüz geçmiş ödev yok." />

      <HomeworkEditorDialog showTrigger={false} writer={writer} item={editItem} open={Boolean(editItem)} onOpenChange={(open) => !open && setEditItem(null)} onSaved={() => { setEditItem(null); router.refresh(); }} />
      <ConfirmDialog open={Boolean(deleteItem)} onOpenChange={(open) => !open && setDeleteItem(null)} title="Ödevi sil" description="Bu ödev herkese açık listeden kalıcı olarak kaldırılacak." confirmLabel="Ödevi Sil" pending={pending} onConfirm={remove} />
    </div>
  );
}

function HomeworkSection({ title, description, items, onEdit, onDelete, empty }: { title: string; description: string; items: HomeworkDto[]; onEdit: (item: HomeworkDto) => void; onDelete: (item: HomeworkDto) => void; empty: string }) {
  return <section><div className="mb-4"><h2 className="text-2xl font-black tracking-tight">{title}</h2><p className="mt-1 text-sm text-muted">{description}</p></div><div className="grid gap-4">{items.length ? items.map((item) => <HomeworkCard key={item.id} item={item} manage onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />) : <div className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">{empty}</div>}</div></section>;
}

function HomeworkCard({ item, manage = false, onEdit, onDelete }: { item: HomeworkDto; manage?: boolean; onEdit?: () => void; onDelete?: () => void }) {
  const dateStatus = manage ? getHomeworkDateStatus(item.dueDate) : null;
  const statusLabel = dateStatus === "overdue" ? "Süresi geçti" : dateStatus === "today" ? "Bugün" : "Yaklaşıyor";
  const statusClass = dateStatus === "overdue" ? "bg-red-100 text-red-800" : dateStatus === "today" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800";
  const SubjectIcon = SUBJECT_ICONS[item.subject];
  return <article className="paper-card flex flex-col p-5 transition-shadow hover:shadow-[0_16px_35px_rgb(16_24_40/10%)]"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-bal-soft text-bal"><SubjectIcon size={21} /></span><div><p className="text-xl font-black leading-tight text-bal">{HOMEWORK_SUBJECT_LABELS[item.subject]}</p></div></div>{manage ? <div className="flex gap-1"><Button variant="ghost" size="icon" aria-label="Ödevi düzenle" onClick={onEdit}><Pencil size={15} /></Button><Button variant="ghost" size="icon" aria-label="Ödevi sil" onClick={onDelete}><Trash2 size={15} /></Button></div> : null}</div><h2 className="mt-5 text-lg font-black leading-snug">{item.title}</h2>{item.description ? <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-muted">{item.description}</p> : null}<div className="mt-auto flex flex-wrap items-center gap-3 pt-6 text-base">{manage && dateStatus ? <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${statusClass}`}>{statusLabel}</span> : null}<span className="inline-flex items-center gap-2 font-black text-bal"><CalendarDays size={18} aria-hidden="true" />{item.dueText || "bilmem"}</span></div>{!manage ? <p className="mt-2 text-base text-muted">- {item.writer.name}</p> : null}</article>;

}

function HomeworkEditorDialog({ writer, item = null, open: controlledOpen, onOpenChange, onSaved, showTrigger = true }: { writer: HomeworkWriterView; item?: HomeworkDto | null; open?: boolean; onOpenChange?: (open: boolean) => void; onSaved: () => void; showTrigger?: boolean }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = { title: String(data.get("title") || ""), description: String(data.get("description") || ""), subject: String(data.get("subject") || "") as HomeworkDto["subject"], dueText: String(data.get("dueText") || ""), dueDate: String(data.get("dueDate") || "") };
    startTransition(async () => {
      const result = item ? await updateHomework(item.id, input) : await createHomework(input);
      if (!result.success) { toast.error(result.error); return; }
      toast.success(item ? "Ödev güncellendi." : "Ödev yayınlandı.");
      setOpen(false);
      onSaved();
    });
  }
  const subject = writer.kind === "TEACHER" ? writer.fixedSubject! : item?.subject || "EDEBIYAT";
  return <><>{showTrigger ? <Button size="lg" className="bg-white text-bal hover:bg-white/90" onClick={() => setOpen(true)}><Plus size={18} /> Yeni Ödev Ekle</Button> : null}</><Dialog open={open} onOpenChange={setOpen}><DialogContent title={item ? "Ödevi düzenle" : "Yeni ödev ekle"} description="Başlık, ders ve teslim bilgisini girin."><form onSubmit={submit} className="space-y-4"><div><label className="label">Başlık</label><input className="field" name="title" defaultValue={item?.title || ""} required minLength={2} maxLength={120} /></div><div><label className="label">Ders</label>{writer.kind === "TEACHER" ? <><input className="field bg-paper-deep" value={HOMEWORK_SUBJECT_LABELS[writer.fixedSubject!]} readOnly /><input type="hidden" name="subject" value={subject} /></> : <select className="field" name="subject" defaultValue={subject}>{HOMEWORK_SUBJECT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}</div><div><label className="label">Teslim <span className="font-normal text-muted">(isteğe bağlı)</span></label><input className="field" name="dueText" placeholder="Örn. ilk derse veya pazartesiye" defaultValue={item?.dueText || ""} maxLength={160} /></div><div><label className="label">Sıralama tarihi <span className="font-normal text-muted">(isteğe bağlı)</span></label><input className="field" name="dueDate" type="date" defaultValue={item?.dueDate || ""} /></div><div><label className="label">Açıklama <span className="font-normal text-muted">(isteğe bağlı)</span></label><textarea className="field min-h-28" name="description" defaultValue={item?.description || ""} maxLength={2000} /></div><Button type="submit" className="w-full" disabled={pending}>Kaydet</Button></form></DialogContent></Dialog></>;
}
