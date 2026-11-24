"use client";
import { useCallback, useEffect, useState } from "react";
import { api, useSession } from "@/lib/useSession";

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
export default function Admin() {
  const { user, ready } = useSession();
  const [ok, setOk] = useState<boolean | null>(null), [tab, setTab] = useState("painel"), [ov, setOv] = useState<Row>({}), [chat, setChat] = useState<Row[]>([]), [thread, setThread] = useState<{ user: string; items: Row[] } | null>(null), [reply, setReply] = useState("");
  const [sug, setSug] = useState<Row[]>([]), [cre, setCre] = useState<{ applications: Row[]; codes: Row[] }>({ applications: [], codes: [] });
  const load = useCallback(async () => {
    const o = await api<Row>("/api/admin", { op: "overview" }); setOk(o.ok); if (!o.ok) return; setOv(o.data);
    setChat(((await api<{ items: Row[] }>("/api/admin", { op: "chat.list" })).data.items) ?? []);
    setSug(((await api<{ items: Row[] }>("/api/admin", { op: "sug.list" })).data.items) ?? []);
    const c = await api<{ applications: Row[]; codes: Row[] }>("/api/admin", { op: "cre.list" }); setCre({ applications: c.data.applications ?? [], codes: c.data.codes ?? [] });
  }, []);
  useEffect(() => { if (ready && user) { const t = setTimeout(load, 0); return () => clearTimeout(t); } }, [ready, user, load]);
  const open = async (u: string) => setThread({ user: u, items: ((await api<{ items: Row[] }>("/api/admin", { op: "chat.thread", user: u })).data.items) ?? [] });
  const act = async (body: object) => { await api("/api/admin", body); load(); };
  if (!ready || ok === null) return <p>A verificar…</p>;
  if (!ok) return <div><h1 className="text-3xl">Administração</h1><p className="mt-2 text-ink2">Sem acesso. Inicia sessão com o email de administrador em Tu → Conta.</p></div>;
  return (
    <div>
      <h1 className="text-[34px] leading-none">Administração</h1>
      <div className="mt-4 flex flex-wrap gap-2" role="tablist">{["painel", "chat", "sugestões", "criadores"].map((t) => <button key={t} role="tab" aria-selected={tab === t} className="chip capitalize" aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</button>)}</div>
      {tab === "painel" && <div className="num mt-5 grid grid-cols-3 gap-3 text-center">{[["Contas", ov.contas], ["Semanas geradas", ov.semanas], ["Scans hoje", ov.scansHoje]].map(([l, v]) => <div key={l as string} className="card p-4"><p className="text-3xl font-semibold">{v as number}</p><p className="text-sm text-ink2">{l}</p></div>)}</div>}
      {tab === "chat" && <div className="mt-5 grid gap-4 md:grid-cols-2"><ul className="space-y-2">{chat.map((c) => <li key={c.user}><button className="card w-full p-3 text-left" onClick={() => open(c.user)}><p className="truncate text-sm">{c.last}</p><p className="text-xs text-ink2">{c.user.slice(0, 8)} · {c.unread ? `${c.unread} por ler` : "lido"}</p></button></li>)}{!chat.length && <li className="text-ink2">Sem mensagens.</li>}</ul>
        {thread && <div className="card space-y-2 p-3">{thread.items.map((m) => <p key={m.id} className={`max-w-[90%] rounded-2xl px-3 py-1.5 ${m.from_admin ? "ml-auto bg-primary text-on-primary" : "bg-tint"}`}>{m.body}</p>)}
          <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); await api("/api/admin", { op: "chat.reply", user: thread.user, body: reply }); setReply(""); open(thread.user); }}><input className="field flex-1" aria-label="Resposta" value={reply} onChange={(e) => setReply(e.target.value)} /><button className="btn btn-primary" disabled={!reply.trim()}>Responder</button></form></div>}</div>}
      {tab === "sugestões" && <ul className="mt-5 space-y-3">{sug.map((s) => <li key={s.id} className="card p-4"><p className="font-medium">{s.title} <span className="text-xs text-ink2">({s.status}{s.hidden ? ", escondida" : ""}, {s.reports} denúncias)</span></p><p className="text-sm text-ink2">{s.description}</p>
        <div className="mt-2 flex flex-wrap gap-2">{[["approve", "Aprovar"], ["reject", "Rejeitar"], ["unhide", "Repor"], ["hide", "Esconder"]].map(([a, l]) => <button key={a} className="btn btn-ghost !min-h-11 text-sm" onClick={() => act({ op: "sug.set", id: s.id, action: a })}>{l}</button>)}</div></li>)}</ul>}
      {tab === "criadores" && <div className="mt-5 space-y-5"><ul className="space-y-3">{cre.applications.map((a) => <li key={a.id} className="card p-4"><p className="font-medium">{a.name} · {a.tiktok} <span className="text-xs text-ink2">({a.status})</span></p><p className="text-sm text-ink2">{a.email} · {a.country} · {a.availability}{a.links ? ` · ${a.links}` : ""}</p>
        {a.status === "pending" && <div className="mt-2 flex gap-2"><button className="btn btn-primary !min-h-11 text-sm" onClick={() => act({ op: "cre.approve", id: a.id })}>Aprovar e criar código</button><button className="btn btn-ghost !min-h-11 text-sm" onClick={() => act({ op: "cre.reject", id: a.id })}>Rejeitar</button></div>}</li>)}</ul>
        <h2 className="text-xl">Códigos</h2><ul className="space-y-2">{cre.codes.map((c) => <li key={c.id} className="card flex items-center justify-between p-3"><span className="num font-semibold">{c.code} <span className="text-sm font-normal text-ink2">· {c.uses} utilizações{c.active ? "" : " · desligado"}</span></span><button className="btn btn-ghost !min-h-11 text-sm" onClick={() => act({ op: "cre.code", id: c.id, active: !c.active })}>{c.active ? "Desligar" : "Ligar"}</button></li>)}</ul></div>}
    </div>
  );
}
