import Link from "next/link";
import { Suspense } from "react";
import { ShieldAlert } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";

const messages: Record<string, string> = {
  yapilandirma: "BAL ID bağlantısı henüz yapılandırılmamış.",
  "gecersiz-istek": "Giriş isteği doğrulanamadı. Lütfen yeniden deneyin.",
  "oturum-suresi": "Giriş isteğinin süresi doldu. Lütfen yeniden başlayın.",
  "kimlik-hatasi": "BAL ID doğrulanmış kimlik bilgilerini paylaşamadı.",
  "yasakli-hesap": "Bu hesap BAL Notes üzerinde yasaklanmış.",
  "baglanti-hatasi": "BAL ID ile bağlantı kurulamadı.",
};

export default function AuthErrorPage({ searchParams }: { searchParams: Promise<{ kod?: string }> }) {
  return <Suspense fallback={<div className="container-shell py-24"><div className="paper-card mx-auto min-h-64 max-w-lg animate-pulse" /></div>}><AuthErrorContent searchParams={searchParams} /></Suspense>;
}

async function AuthErrorContent({ searchParams }: { searchParams: Promise<{ kod?: string }> }) {
  const { kod } = await searchParams;
  return <div className="container-shell py-24"><div className="paper-card mx-auto max-w-lg p-8 text-center"><ShieldAlert className="mx-auto text-bal" size={38} /><h1 className="mt-4 text-2xl font-black">Giriş tamamlanamadı</h1><p className="mt-2 text-sm leading-6 text-muted">{messages[kod || ""] || "Beklenmeyen bir kimlik doğrulama hatası oluştu."}</p><div className="mt-6 flex justify-center gap-2"><Link href="/auth/bal-id" className={buttonStyles()}>Tekrar Dene</Link><Link href="/" className={buttonStyles({ variant: "outline" })}>Ana Sayfa</Link></div></div></div>;
}
