import { HomeworkPublicPage } from "@/components/homework-page";
import { getPublicHomework } from "@/lib/homework-data";
import { homeworkAppUrl } from "@/lib/utils";

export const metadata = { title: "Okul ödevleri", description: "Bornova Anadolu Lisesi ders ödevleri ve teslim tarihleri.", alternates: { canonical: homeworkAppUrl() } };

export default async function HomeworkPage() {
  const homework = await getPublicHomework();
  return <div className="container-shell py-10 sm:py-14"><HomeworkPublicPage homework={homework} /></div>;
}
