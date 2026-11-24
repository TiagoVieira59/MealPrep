"use client";
import { Bot, ChevronRight, Lightbulb, MessageCircle, RefreshCw, ScanLine, Shield, Trash2, UserRound, Users, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePlan } from "@/lib/usePlan";
import { supabase } from "@/lib/supabase/client";
import { clearLocal } from "@/lib/sync";
import { api, useSession } from "@/lib/useSession";
import { Skeleton } from "@/components/DayView";
import { Metas } from "@/components/Metas";
import { Msg } from "@/components/Sub";
import { Disclaimer, Footer, Sheet } from "@/components/ui";

const Row = ({ href, icon: I, label, badge }: { href: string; icon: typeof Bot; label: string; badge?: number }) => (
  <Link href={href} className="card flex min-h-14 items-center justify-between px-4"><span className="flex items-center gap-3"><I size={20} />{label}{!!badge && <span className="num rounded-full bg-protein px-2 text-xs font-semibold text-white" aria-label={`${badge} não lidas`}>{badge}</span>}</span><ChevronRight size={18} /></Link>
);
export default function Tu() {
  const p = usePlan(), router = useRouter(), { user } = useSession();
  const [unread, setUnread] = useState(0), [code, setCode] = useState(""), [msg, setMsg] = useState({ t: "", ok: false }), [del, setDel] = useState(false), [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!user) return;
    supabase().from("chat_messages").select("id", { count: "exact", head: true }).eq("from_admin", true).eq("read", false).then((r: { count: number | null }) => setUnread(r.count ?? 0));
    if (!user.is_anonymous) api("/api/admin", { op: "overview" }).then((r) => setIsAdmin(r.ok));
  }, [user]);
  if (!p.ready) return <Skeleton />;
  const { answers, setAnswers } = p;
  const redeem = async () => { const r = await api("/api/creators/redeem", { code }); setMsg({ t: r.ok ? "Código registado. Obrigado!" : r.data.erro ?? "Erro.", ok: r.ok }); if (r.ok) setCode(""); };
  const remove = async () => { const r = await api("/api/account", undefined, "DELETE"); if (!r.ok) { setMsg({ t: r.data.erro ?? "Erro.", ok: false }); return; } await supabase().auth.signOut(); clearLocal(); location.assign("/bem-vindo"); };
  return (
    <div className="max-w-xl">
      <h1 className="text-[34px] leading-none">Tu</h1>
      <section className="mt-6"><Metas a={answers} set={(x) => setAnswers((a) => ({ ...a, ...x }))} compact /><p className="mt-3 text-sm text-ink2">As alterações às metas e às respostas aplicam-se à semana seguinte.</p></section>
      <section className="mt-8 space-y-3">
        <button className="card flex min-h-14 w-full items-center justify-between px-4 text-left" onClick={() => { setAnswers((a) => ({ ...a, step: 0 })); router.push("/bem-vindo"); }}><span className="flex items-center gap-3"><RefreshCw size={20} />Refazer questionário</span><ChevronRight size={18} /></button>
        <Row href="/tu/agregado" icon={Users} label="Agregado" />
        <Row href="/tu/conta" icon={UserRound} label="Conta e outros dispositivos" />
        <Row href="/tu/scan" icon={ScanLine} label="Scan the Plate" />
        <Row href="/tu/chat" icon={MessageCircle} label="Chat de apoio" badge={unread} />
        <Row href="/tu/sugestoes" icon={Lightbulb} label="Sugestões" />
        <Row href="/criadores" icon={Bot} label="Sou criador de conteúdo" />
        {isAdmin && <Row href="/admin" icon={Shield} label="Administração" />}
      </section>
      <section className="card mt-6 space-y-2 p-4"><h2 className="text-lg">Código de criador</h2>
        <p className="text-sm text-ink2">Se um criador te trouxe até aqui, indica o código. Só regista quem te recomendou: não desbloqueia nada.</p>
        <div className="flex gap-2"><label className="flex-1"><span className="sr-only">Código</span><input className="field uppercase" value={code} maxLength={30} onChange={(e) => setCode(e.target.value)} /></label><button className="btn btn-ghost" disabled={code.trim().length < 3} onClick={redeem}>Registar</button></div>
        <Msg text={msg.t} ok={msg.ok} /></section>
      <section className="mt-6 space-y-3"><Row href="/privacidade" icon={FileText} label="Privacidade" /><Row href="/termos" icon={FileText} label="Termos" />
        <button className="card flex min-h-14 w-full items-center gap-3 px-4 text-left text-err" onClick={() => setDel(true)}><Trash2 size={20} />Eliminar conta e dados</button></section>
      <div className="mt-8"><Disclaimer /></div>
      <Sheet open={del} onClose={() => setDel(false)} title="Eliminar conta?"><p className="text-ink2">Apaga a tua conta e todos os dados no servidor (planos, mensagens, sugestões). Não se pode desfazer.</p>
        <div className="mt-4 grid gap-2"><button className="btn bg-err text-white" onClick={remove}>Sim, eliminar tudo</button><button className="btn btn-ghost" onClick={() => setDel(false)}>Cancelar</button></div></Sheet>
      <Footer />
    </div>
  );
}
