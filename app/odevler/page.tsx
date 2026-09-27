import { HomeworkPublicPage } from "@/components/homework-page";
import { getPublicHomework } from "@/lib/homework-data";

export const metadata = { title: "Ödevler" };

export default async function HomeworkPage() {
  const homework = await getPublicHomework();
  return <div className="container-shell py-10 sm:py-14"><div className="mb-8 max-w-2xl"><h1 className="section-title text-4xl">Ödevler</h1><p className="mt-3 text-muted">Derslere göre güncel ödevleri ve teslim tarihlerini burada bulabilirsiniz.</p></div><HomeworkPublicPage homework={homework} /></div>;
}
import { Suspense } from "react";
