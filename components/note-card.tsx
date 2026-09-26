import Image from "next/image";
import Link from "next/link";
import { FileText } from "lucide-react";
import type { NoteCardData } from "@/lib/data";
import { GRADE_LABELS } from "@/lib/constants";
import { formatRelativeDate } from "@/lib/utils";
import { Avatar } from "@/components/avatar";
import { VoteButton } from "@/components/vote-button";

export function NoteCard({ note, featured = false }: { note: NoteCardData; featured?: boolean }) {
  const subject = note.subject?.name || note.customSubject || "Diğer";
  const cover = note.assets[0];
  return (
    <article className="paper-card note-card group overflow-hidden">
      <div className="flex gap-3 p-4 sm:p-5">
        <VoteButton noteId={note.id} initialCount={note._count.votes} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em]">
            <span className="rounded-full bg-bal px-2.5 py-1 text-white">{GRADE_LABELS[note.gradeLevel]}</span>
            <span className="rounded-full bg-bal-soft px-2.5 py-1 text-bal">{subject}</span>
            {featured ? <span className="rounded-full bg-ink px-2.5 py-1 text-white">Önerilen</span> : null}
          </div>
          <Link href={`/notlar/${note.id}`} className="mt-3 block">
            <h3 className="text-lg font-black leading-tight tracking-[-0.025em] text-ink group-hover:text-bal sm:text-xl">{note.title}</h3>
            {note.description ? <p className="line-clamp-2 mt-2 text-sm leading-6 text-muted">{note.description}</p> : null}
          </Link>
          {cover ? (
            <Link href={`/notlar/${note.id}`} className="mt-4 block overflow-hidden rounded-xl border border-line bg-paper-deep">
              {cover.contentType.startsWith("image/") ? (
                <div className="relative aspect-[16/8]"><Image src={`/api/assets/${cover.id}`} alt={`${note.title} önizlemesi`} fill unoptimized sizes="(max-width: 768px) 100vw, 540px" className="object-cover transition-transform duration-300 group-hover:scale-[1.015]" /></div>
              ) : (
                <div className="flex h-24 items-center justify-center gap-3 text-bal"><FileText size={28} /><span className="text-sm font-bold">PDF notu · {note.assets.length} dosya</span></div>
              )}
            </Link>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
            <Avatar name={note.author.name} picture={note.author.picture} className="size-6 text-[8px]" />
            <span className="font-bold text-ink/75">{note.author.name}</span>
            <span aria-hidden>·</span>
            <time dateTime={(note.publishedAt || note.submittedAt || note.createdAt).toISOString()}>{formatRelativeDate(note.publishedAt || note.submittedAt || note.createdAt)}</time>
            {note.assets.length > 1 ? <><span aria-hidden>·</span><span>{note.assets.length} dosya</span></> : null}
          </div>
        </div>
      </div>
    </article>
  );
}
