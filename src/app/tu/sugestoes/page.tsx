"use client";
import { ChevronUp, Flag, EyeOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/useSession";
import { Msg, Sub } from "@/components/Sub";

interface S { id: string; title: string; description: string; status: string; mine: boolean; votes: number; voted: boolean }
export default function Sugestoes() {
  const [items, setItems] = useState<S[]>([]), [t, setT] = useState(""), [d, setD] = useState(""), [msg, setMsg] = useState({ t: "", ok: false });
  const load = useCallback(async () => { const r = await api<{ items: S[] }>("/api/suggestions", undefined, "GET"); if (r.ok) setItems(r.data.items); }, []);
  useEffect(() => { const x = setTimeout(load, 0); return () => clearTimeout(x); }, [load]);
  const act = async (body: object, ok = "") => { const r = await api("/api/suggestions", body); setMsg({ t: r.ok ? ok : r.data.erro ?? "Erro.", ok: r.ok }); load(); };
  return (
    <Sub title="Sugestões" hint="Diz-nos o que falta. As sugestões ficam privadas até serem aprovadas; depois aparecem sem autor e podes votar.">
      <form className="card space-y-3 p-4" onSubmit={(e) => { e.preventDefault(); act({ op: "create", title: t, description: d }, "Sugestão enviada. Fica privada até ser aprovada."); setT(""); setD(""); }}>
        <label className="block text-sm font-medium">Título<input className="field mt-1" value={t} maxLength={120} onChange={(e) => setT(e.target.value)} /></label>
        <label className="block text-sm font-medium">Descrição<textarea className="field mt-1 min-h-24 py-3" value={d} maxLength={1000} onChange={(e) => setD(e.target.value)} /></label>
        <button className="btn btn-primary w-full" disabled={t.trim().length < 3 || d.trim().length < 3}>Enviar sugestão</button><Msg text={msg.t} ok={msg.ok} /></form>
      <ul className="space-y-3">
        {items.map((s) => (
          <li key={s.id} className="card p-4"><div className="flex gap-3">
            {s.status === "approved" ? <button className={`flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl border ${s.voted ? "border-primary bg-primary text-on-primary" : "border-line"}`} aria-pressed={s.voted} aria-label={`Votar: ${s.votes} votos`} onClick={() => act({ op: "vote", id: s.id, on: !s.voted })}><ChevronUp size={18} /><span className="num text-sm font-semibold">{s.votes}</span></button> : null}
            <div className="min-w-0 flex-1"><p className="font-display text-lg leading-snug">{s.title}</p><p className="mt-0.5 text-sm text-ink2">{s.description}</p>
              {s.mine && s.status !== "approved" && <p className="mt-1 text-xs font-medium text-warn">{s.status === "pending" ? "Privada: a aguardar aprovação" : "Não aprovada"}</p>}</div></div>
            {s.status === "approved" && !s.mine && <div className="mt-2 flex gap-2 text-sm">
              <button className="btn btn-ghost !min-h-11 gap-1.5 text-sm" onClick={() => act({ op: "report", id: s.id }, "Denúncia registada. Obrigado.")}><Flag size={14} />Denunciar</button>
              <button className="btn btn-ghost !min-h-11 gap-1.5 text-sm" onClick={() => act({ op: "hide-author", id: s.id }, "Não vais ver mais sugestões deste autor.")}><EyeOff size={14} />Esconder autor</button></div>}
          </li>))}
        {!items.length && <li className="text-ink2">Ainda não há sugestões aprovadas.</li>}
      </ul>
    </Sub>
  );
}
