import { getActiveSubjects, getNoteFeed } from "@/lib/data";
import { NotesArchive } from "@/components/notes-archive";
import { appUrl } from "@/lib/utils";

export const metadata = { title: "Ders notları", description: "BAL öğrencilerinin sınava hazırlanmak için paylaştığı ders notlarını keşfet.", alternates: { canonical: appUrl("/notlar") } };

export default async function NotesPage() {
  const [feed, subjects] = await Promise.all([
    getNoteFeed({ sort: "new", page: 1 }),
    getActiveSubjects(),
  ]);
  return <NotesArchive feed={feed} subjects={subjects} params={{}} sort="new" />;
}
