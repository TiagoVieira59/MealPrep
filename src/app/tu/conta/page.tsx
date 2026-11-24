"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { clearLocal, restoreFromServer } from "@/lib/sync";
import { useSession } from "@/lib/useSession";
import { Msg, Sub } from "@/components/Sub";

const GOOGLE = process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "1"; // preparado, desligado por defeito (ver README)

export default function Conta() {
  const { user, anonymous } = useSession(), router = useRouter();
  const [email, setEmail] = useState(""), [pw, setPw] = useState(""), [msg, setMsg] = useState({ t: "", ok: false }), [busy, setBusy] = useState(false);
  const run = async (f: () => Promise<string | void>) => { setBusy(true); setMsg({ t: "", ok: false }); try { const m = await f(); if (m) setMsg({ t: m, ok: true }); } catch (e) { const m = (e as Error).message ?? ""; setMsg({ t: /rate limit/i.test(m) ? "Demasiados pedidos de email. Tenta mais tarde." : /invalid|valid/i.test(m) ? "Email inválido." : /already|registered/i.test(m) ? "Esse email já está em uso." : /password/i.test(m) ? "Palavra-passe inválida (mínimo 8 caracteres)." : /incorretos/.test(m) ? m : "Algo correu mal. Tenta de novo.", ok: false }); } setBusy(false); };
  const valid = /^\S+@\S+\.\S+$/.test(email) && pw.length >= 8;
  return (
    <Sub title="Conta" hint="Começaste com uma conta anónima automática: não há palavra-passe para esquecer.">
      <p className="card p-4 text-sm">{anonymous ? "Conta anónima neste dispositivo." : `Sessão iniciada como ${user?.email ?? "…"}.`}</p>
      {anonymous && <p className="text-sm text-ink2">Para usares a MealPrep noutro dispositivo sem perder dados, acrescenta um email e uma palavra-passe a esta conta.</p>}
      <form className="card space-y-3 p-4" onSubmit={(e) => e.preventDefault()}>
        <h2 className="text-lg">{anonymous ? "Usar noutro dispositivo" : "Entrar noutro dispositivo"}</h2>
        <label className="block text-sm font-medium">Email<input className="field mt-1" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="block text-sm font-medium">Palavra-passe (mínimo 8 caracteres)<input className="field mt-1" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        <Msg text={msg.t} ok={msg.ok} />
        {anonymous && <button className="btn btn-primary w-full" disabled={!valid || busy} onClick={() => run(async () => {
          const { error } = await supabase().auth.updateUser({ email, password: pw }); if (error) throw error;
          return "Feito. Se receberes um email de confirmação, abre a ligação para concluir.";
        })}>Acrescentar email e palavra-passe</button>}
        <button className="btn btn-ghost w-full" disabled={!valid || busy} onClick={() => run(async () => {
          const { error } = await supabase().auth.signInWithPassword({ email, password: pw }); if (error) throw new Error("Email ou palavra-passe incorretos.");
          const ok = await restoreFromServer(); if (ok) router.push("/");
          return ok ? undefined : "Sessão iniciada, mas ainda não há nenhuma semana guardada nesta conta.";
        })}>Já tenho conta: entrar</button>
        {GOOGLE && <button className="btn btn-ghost w-full" onClick={() => supabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin } })}>Continuar com Google</button>}
      </form>
      {!anonymous && <button className="btn btn-ghost w-full" onClick={async () => { await supabase().auth.signOut(); clearLocal(); location.assign("/bem-vindo"); }}>Terminar sessão</button>}
    </Sub>
  );
}
