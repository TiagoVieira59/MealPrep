"use client";
import { useState } from "react";
import { api } from "@/lib/useSession";
import { Msg } from "@/components/Sub";
import { Footer } from "@/components/ui";

export default function Criadores() {
  const [f, setF] = useState({ name: "", email: "", country: "Portugal", tiktok: "", links: "", availability: "agora", website: "" }), [msg, setMsg] = useState({ t: "", ok: false }), [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));
  const send = async () => { setBusy(true); const r = await api("/api/creators/apply", { ...f, links: f.links || undefined }); setBusy(false); setMsg({ t: r.ok ? "Recebemos a tua candidatura. Respondemos por email." : r.data.erro ?? "Erro.", ok: r.ok }); };
  return (
    <div className="max-w-xl">
      <h1 className="text-[28px] leading-tight">Criadores</h1>
      <p className="mt-2 text-ink2">Fazes conteúdo sobre alimentação? Candidata-te para falarmos de promoção. Não pedimos dados de pagamento; usamos estes dados só para te responder.</p>
      <form className="card mt-5 space-y-3 p-4" onSubmit={(e) => { e.preventDefault(); send(); }}>
        {([["name", "Nome", "text"], ["email", "Email", "email"], ["country", "País", "text"], ["tiktok", "@ do TikTok", "text"], ["links", "Outros links (opcional)", "text"]] as const).map(([k, l, t]) => (
          <label key={k} className="block text-sm font-medium">{l}<input className="field mt-1" type={t} value={f[k]} required={k !== "links"} maxLength={120} onChange={(e) => set(k, e.target.value)} /></label>))}
        <label className="block text-sm font-medium">Disponibilidade<select className="field mt-1" value={f.availability} onChange={(e) => set("availability", e.target.value)}><option value="agora">Agora</option><option value="1-2 semanas">Daqui a 1–2 semanas</option><option value="mais de 3 semanas">Daqui a mais de 3 semanas</option></select></label>
        <input aria-hidden tabIndex={-1} autoComplete="off" className="hidden" value={f.website} onChange={(e) => set("website", e.target.value)} />
        <Msg text={msg.t} ok={msg.ok} /><button className="btn btn-primary w-full" disabled={busy}>Enviar candidatura</button></form>
      <Footer />
    </div>
  );
}
