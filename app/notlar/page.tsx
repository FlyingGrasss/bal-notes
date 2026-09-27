import { getActiveSubjects, getNoteFeed } from "@/lib/data";
import { NotesArchive } from "@/components/notes-archive";

export const metadata = { title: "Notlar", description: "BAL öğrencilerinin paylaştığı ders notlarını sınıf ve derse göre keşfet." };

export default async function NotesPage() {
  const [feed, subjects] = await Promise.all([
    getNoteFeed({ sort: "new", page: 1 }),
    getActiveSubjects(),
  ]);
  return <NotesArchive feed={feed} subjects={subjects} params={{}} sort="new" />;
}
