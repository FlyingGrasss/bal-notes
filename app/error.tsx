"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return <div className="container-shell py-24"><div className="paper-card mx-auto max-w-xl p-8 text-center"><AlertTriangle className="mx-auto text-bal" size={34} /><h1 className="mt-4 text-2xl font-black">Bir şey yolunda gitmedi</h1><p className="mt-2 text-sm leading-6 text-muted">Veritabanı veya servis bağlantısını kontrol edip tekrar deneyin.</p><Button className="mt-6" onClick={reset}>Tekrar Dene</Button></div></div>;
}
