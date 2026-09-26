import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return <div className="container-shell py-24"><div className="paper-card mx-auto max-w-lg p-8 text-center"><SearchX className="mx-auto text-bal" size={38} /><h1 className="mt-4 text-3xl font-black">Burada bir not yok</h1><p className="mt-2 text-muted">Bağlantı hatalı olabilir veya içerik kaldırılmış olabilir.</p><Link href="/notlar" className={buttonStyles({ className: "mt-6" })}>Notlara Dön</Link></div></div>;
}
