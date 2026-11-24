"use client";
import { Copy, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { K, useLocal } from "@/lib/store";
import { api, useSession } from "@/lib/useSession";
import { usePlan } from "@/lib/usePlan";
import { Msg, Sub } from "@/components/Sub";
import type { HouseholdLocal } from "@/lib/sync";
import { writeLocal } from "@/lib/store";

export default function Agregado() {
  const { user } = useSession(), router = useRouter(), p = usePlan();
  const [hh, setHh] = useLocal<HouseholdLocal | null>(K.household, null);
  const [mine, setMine] = useState(true), [code, setCode] = useState(""), [msg, setMsg] = useState({ t: "", ok: false }), [busy, setBusy] = useState(false);
  const targets = () => (mine ? { kcal: p.answers.kcal ?? null, protein: p.answers.protein ?? null } : { kcal: null, protein: null });
  const after = async (id: string, c?: string) => {
    setHh({ id, code: c }); writeLocal(K.me, user!.id);
    router.push("/gerar"); // gera a semana para todos os membros
  };
  const create = async () => { setBusy(true); const r = await api<{ id: string; code: string }>("/api/household/create", targets()); setBusy(false); if (!r.ok) return setMsg({ t: r.data.erro ?? "Erro.", ok: false }); await after(r.data.id, r.data.code); };
  const join = async () => { setBusy(true); const r = await api<{ id: string }>("/api/household/join", { code, ...targets() }); setBusy(false); if (!r.ok) return setMsg({ t: r.data.erro ?? "Erro.", ok: false }); await after(r.data.id); };
  const leave = async () => { const { supabase } = await import("@/lib/supabase/client"); await supabase().from("household_members").delete().eq("user_id", user!.id); setHh(null); writeLocal(K.me, "me"); setMsg({ t: "Saíste do agregado.", ok: true }); };
  return (
    <Sub title="Agregado" hint="Partilha a semana e a lista com quem come contigo. O prato é o mesmo; as porções escalam por pessoa.">
      {hh ? (
        <>
          <section className="card space-y-3 p-4"><p className="flex items-center gap-2 font-medium"><Users size={18} />Estás num agregado</p>
            {hh.code ? <><p className="text-sm text-ink2">Código para partilhar (só aparece neste dispositivo):</p>
              <p className="num text-center text-4xl font-semibold tracking-[0.2em]" aria-label={`Código ${hh.code.split("").join(" ")}`}>{hh.code}</p>
              <button className="btn btn-ghost w-full gap-2" onClick={async () => { await navigator.clipboard?.writeText(hh.code!); setMsg({ t: "Código copiado.", ok: true }); }}><Copy size={16} />Copiar código</button></>
              : <p className="text-sm text-ink2">O código foi mostrado no dispositivo de quem criou o agregado. No servidor só guardamos uma versão cifrada (HMAC).</p>}
          </section>
          <button className="btn btn-primary w-full" onClick={() => router.push("/gerar")}>Gerar a semana para o agregado</button>
          <button className="btn btn-ghost w-full" onClick={leave}>Sair do agregado</button>
        </>
      ) : (
        <>
          <fieldset className="card space-y-2 p-4"><legend className="px-1 text-sm font-medium">As tuas porções</legend>
            <label className="flex min-h-11 items-center gap-3"><input type="radio" checked={mine} onChange={() => setMine(true)} className="h-5 w-5" />Usar as minhas metas</label>
            <label className="flex min-h-11 items-center gap-3"><input type="radio" checked={!mine} onChange={() => setMine(false)} className="h-5 w-5" />Porção normal (≈ 2000 kcal/dia)</label></fieldset>
          <button className="btn btn-primary w-full" disabled={busy || !user} onClick={create}>Criar agregado e gerar código</button>
          <div className="card space-y-3 p-4"><h2 className="text-lg">Tenho um código</h2>
            <label className="block text-sm font-medium">Código de 6 caracteres<input className="field num mt-1 text-center text-xl uppercase tracking-widest" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} /></label>
            <button className="btn btn-ghost w-full" disabled={busy || code.length !== 6 || !user} onClick={join}>Entrar no agregado</button></div>
        </>
      )}
      <Msg text={msg.t} ok={msg.ok} />
    </Sub>
  );
}
