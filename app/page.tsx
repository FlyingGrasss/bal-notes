import Link from "next/link";
import { ArrowRight, BookOpen, Quote, Sparkles, TrendingUp } from "lucide-react";
import { getHomeData } from "@/lib/data";
import { GRADE_OPTIONS } from "@/lib/constants";
import { NoteCard } from "@/components/note-card";
import { EmptyState } from "@/components/empty-state";
import { buttonStyles } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { recommended, popular, recent, quotes } = await getHomeData();
  return (
    <>
      <section className="container-shell py-8 sm:py-12">
        <div className="hero-panel grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_21rem] lg:items-end">
          <div>
            <p className="eyebrow text-[#ff9baa]">Bornova Anadolu Lisesi</p>
            <h1 className="display-title mt-4 max-w-4xl text-white">Notunu paylaş.<br /><span className="text-[#ff8999]">Sınıfını ileri taşı.</span></h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-white/65 sm:text-lg">Hazırlıktan 12. sınıfa, öğrencilerin gerçek ders notları ve koridorda unutulmayan hoca sözleri tek yerde.</p>
            <div className="mt-7 flex flex-wrap gap-3"><Link href="/notlar" className={buttonStyles({ size: "lg" })}><BookOpen size={19} /> Notları Keşfet</Link><Link href="/paylas" className={buttonStyles({ variant: "outline", size: "lg", className: "border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/15" })}>Not Paylaş <ArrowRight size={18} /></Link></div>
          </div>
          <div className="hero-note relative overflow-hidden p-6 text-white sm:p-7">
            <Quote className="absolute -right-3 -top-3 text-white/10" size={110} />
            <p className="relative text-[10px] font-black uppercase tracking-[0.2em] text-white/60">BAL’da bugün</p>
            <blockquote className="relative mt-5 text-2xl font-black leading-tight">{quotes[0] ? `“${quotes[0].quote}”` : "İlk unutulmaz sözü sen paylaş."}</blockquote>
            <p className="relative mt-4 text-sm font-bold text-white/70">{quotes[0] ? `— ${quotes[0].teacherName}` : "— BAL Notes"}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-2 sm:mt-5 sm:gap-3">
          {GRADE_OPTIONS.map((grade) => <Link key={grade.value} href={`/notlar?sinif=${grade.value}`} className="paper-card grade-card flex flex-col items-center justify-center p-2 text-center"><span className="text-xl font-black text-bal sm:text-2xl">{grade.short}</span><span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-muted sm:text-[11px]">{grade.label}</span></Link>)}
        </div>
      </section>

      <HomeSection eyebrow="Editör seçkisi" title="Önerilen notlar" icon={<Sparkles size={18} />} href="/notlar">
        {recommended.length ? <div className="grid gap-4 lg:grid-cols-2">{recommended.map((note) => <NoteCard key={note.id} note={note} featured />)}</div> : <EmptyState title="Henüz önerilen not yok" description="İlk notlar onaylandığında burada görünecek." />}
      </HomeSection>

      <HomeSection eyebrow="Topluluğun seçimi" title="En çok oy alanlar" icon={<TrendingUp size={18} />} href="/notlar?sirala=top">
        {popular.length ? <div className="grid gap-4 lg:grid-cols-2">{popular.slice(0, 4).map((note) => <NoteCard key={note.id} note={note} />)}</div> : <EmptyState title="Oy bekleyen notlar" description="Onaylanan notlara oy vererek en faydalıları yukarı taşı." />}
      </HomeSection>

      <HomeSection eyebrow="Taze mürekkep" title="Yeni eklenenler" icon={<BookOpen size={18} />} href="/notlar?sirala=yeni">
        {recent.length ? <div className="grid gap-4 lg:grid-cols-2">{recent.slice(0, 4).map((note) => <NoteCard key={note.id} note={note} />)}</div> : <EmptyState title="Henüz not eklenmedi" description="BAL Notes’un ilk notunu paylaşan sen olabilirsin." />}
      </HomeSection>

      <section className="container-shell py-10 sm:py-12">
        <div className="rounded-3xl bg-ink p-6 text-white sm:p-10">
          <div className="flex items-end justify-between gap-4"><div><p className="eyebrow text-[#ff8da0]">Teneffüs arşivi</p><h2 className="section-title mt-2">Hocalar ne dedi?</h2></div><Link href="/sozler" className="shrink-0 text-sm font-bold text-white/70 hover:text-white">Tüm sözler <ArrowRight className="inline" size={16} /></Link></div>
          <div className="mt-7 grid gap-3 md:grid-cols-3">{quotes.slice(0, 3).map((quote) => <blockquote key={quote.id} className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-lg font-black leading-snug">“{quote.quote}”</p><footer className="mt-4 text-xs font-bold text-white/55">— {quote.teacherName}</footer></blockquote>)}</div>
        </div>
      </section>
    </>
  );
}

function HomeSection({ eyebrow, title, icon, href, children }: { eyebrow: string; title: string; icon: React.ReactNode; href: string; children: React.ReactNode }) {
  return <section className="container-shell py-8 sm:py-10"><div className="mb-6 flex items-end justify-between gap-4"><div><p className="eyebrow flex items-center gap-2">{icon}{eyebrow}</p><h2 className="section-title mt-2">{title}</h2></div><Link href={href} className="shrink-0 text-sm font-bold text-bal hover:text-bal-bright">Tümünü Gör <ArrowRight className="inline" size={16} /></Link></div>{children}</section>;
}
