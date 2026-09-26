"use client";

import { useState } from "react";
import { Check, Copy, Send, Share2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ShareDialog({ noteId, title, autoOpen = false, trigger }: { noteId: string; title: string; autoOpen?: boolean; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(autoOpen);
  const [copied, setCopied] = useState(false);
  const url = typeof window === "undefined" ? "" : `${window.location.origin}/notlar/${noteId}`;

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function share() {
    if (navigator.share) await navigator.share({ title, text: "Bu BAL notuna bak!", url });
    else await copy();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 text-sm font-bold text-bal hover:text-bal-bright">{trigger}</button> : null}
      <DialogContent title="Arkadaşlarınla paylaş" description="Notun doğrudan bağlantısı yayında. Ana sayfada görünmesi için yönetici onayı bekleyecek.">
        <div className="rounded-xl border border-line bg-white p-3 text-sm text-muted break-all">{url || `/notlar/${noteId}`}</div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button onClick={share}><Share2 size={17} /> Cihazla Paylaş</Button>
          <Button variant="outline" onClick={copy}>{copied ? <Check size={17} /> : <Copy size={17} />} {copied ? "Kopyalandı" : "Bağlantıyı Kopyala"}</Button>
          <a className="sm:col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white hover:bg-[#20bd5a]" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`}><Send size={17} /> WhatsApp ile Gönder</a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
