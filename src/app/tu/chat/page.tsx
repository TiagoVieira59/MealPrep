"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ensureSession, supabase } from "@/lib/supabase/client";
import { Msg, Sub } from "@/components/Sub";

interface M { id: number; from_admin: boolean; body: string; created_at: string }
export default function Chat() {
  const [items, setItems] = useState<M[]>([]), [text, setText] = useState(""), [err, setErr] = useState(""), end = useRef<HTMLDivElement>(null);
  const load = useCallback(async () => {
    try { const u = await ensureSession(), sb = supabase();
      const { data } = await sb.from("chat_messages").select("id,from_admin,body,created_at").order("created_at"); setItems((data as M[]) ?? []);
      await sb.from("chat_messages").update({ read: true }).eq("user_id", u.id).eq("from_admin", true).eq("read", false);
    } catch { /* offline */ }
  }, []);
  useEffect(() => { const t0 = setTimeout(load, 0); const t = setInterval(load, 10000); return () => { clearTimeout(t0); clearInterval(t); }; }, [load]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [items.length]);
  const send = async () => {
    const body = text.trim(); if (!body) return; setErr("");
    try { const u = await ensureSession(); const { error } = await supabase().from("chat_messages").insert({ user_id: u.id, body }); if (error) throw error; setText(""); load(); } catch { setErr("Não foi possível enviar. Tenta de novo."); }
  };
  return (
    <Sub title="Chat de apoio" hint="Escreve-nos. Respondemos aqui, em português, assim que possível.">
      <div className="card max-h-[55dvh] min-h-48 space-y-2 overflow-y-auto p-3" aria-live="polite">
        {items.length === 0 && <p className="p-2 text-ink2">Ainda não há mensagens. Diz-nos o que precisas.</p>}
        {items.map((m) => <div key={m.id} className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${m.from_admin ? "bg-tint" : "ml-auto bg-primary text-on-primary"}`}>{m.body}</div>)}<div ref={end} />
      </div>
      <Msg text={err} />
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <label className="flex-1"><span className="sr-only">Mensagem</span><input className="field" value={text} maxLength={2000} placeholder="Escreve uma mensagem" onChange={(e) => setText(e.target.value)} /></label>
        <button className="btn btn-primary" disabled={!text.trim()}>Enviar</button></form>
    </Sub>
  );
}
