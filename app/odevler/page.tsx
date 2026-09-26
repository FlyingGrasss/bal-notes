import { HomeworkPageClient } from "@/components/homework-page";
import { getHomeworkPageData } from "@/lib/homework-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ödevler" };

export default async function HomeworkPage() {
  const data = await getHomeworkPageData();
  return <div className="container-shell py-10 sm:py-14"><div className="mb-8 max-w-2xl"><p className="eyebrow">Okul geneli</p><h1 className="section-title mt-2 text-4xl">Ödevler</h1><p className="mt-3 text-muted">Derslere göre güncel ödevleri ve teslim tarihlerini burada bulabilirsiniz.</p></div><HomeworkPageClient {...data} /></div>;
}
