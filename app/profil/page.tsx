import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { ProfileDashboard } from "@/components/profile-dashboard";
import { ProfileLoading } from "@/components/profile-loading";
import { requireUser } from "@/lib/auth";
import { getActiveSubjects, getProfileData } from "@/lib/data";

export const metadata = { title: "Profilim", robots: { index: false, follow: false } };

export default function ProfilePage() {
  return <Suspense fallback={<ProfileLoading />}><ProfilePageContent /></Suspense>;
}

async function ProfilePageContent() {
  const user = await requireUser("/profil");
  const [{ notes, quotes }, subjects] = await Promise.all([getProfileData(user.id), getActiveSubjects()]);
  return (
    <div className="container-shell py-10 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <header className="paper-card mb-8 flex items-center gap-4 p-5 sm:p-7"><Avatar name={user.name} picture={user.picture} className="size-15 text-base" /><div><p className="eyebrow">BAL ID hesabı</p><h1 className="mt-1 text-2xl font-black">{user.name}</h1><p className="mt-1 text-sm text-muted">{user.email}</p></div></header>
        <ProfileDashboard
          notes={notes.map((note) => ({ id: note.id, title: note.title, description: note.description, gradeLevel: note.gradeLevel, subjectId: note.subjectId, customSubject: note.customSubject, status: note.status, rejectionReason: note.rejectionReason, updatedAt: note.updatedAt.toISOString(), assetCount: note.assets.length, subjectName: note.subject?.name || null }))}
          quotes={quotes.map((quote) => ({ id: quote.id, teacherName: quote.teacherName, quote: quote.quote, context: quote.context, gradeLevel: quote.gradeLevel, subjectId: quote.subjectId, subjectName: quote.subject?.name || null, status: quote.status, rejectionReason: quote.rejectionReason, updatedAt: quote.updatedAt.toISOString() }))}
          subjects={subjects.map(({ id, name, gradeLevel }) => ({ id, name, gradeLevel }))}
        />
      </div>
    </div>
  );
}
