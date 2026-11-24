import { NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/server";
import { err, hmac, requireUser } from "@/lib/server/auth";

export async function GET() {
  const u = await requireUser(); if (!u) return err("Sem sessão.", 401);
  const sb = adminClient(), me = hmac("author:" + u.id);
  const [{ data: sug }, { data: votes }, { data: hid }] = await Promise.all([
    sb.from("suggestions").select("id,title,description,status,hidden,author_key,created_at").or(`and(status.eq.approved,hidden.eq.false),author.eq.${u.id}`),
    sb.from("suggestion_votes").select("suggestion_id,user_id"),
    sb.from("suggestion_hidden_authors").select("author_key").eq("user_id", u.id),
  ]);
  const hidden = new Set((hid ?? []).map((x) => x.author_key));
  const out = (sug ?? []).filter((s) => s.author_key === me || !hidden.has(s.author_key)).map((s) => ({
    id: s.id, title: s.title, description: s.description, status: s.status, hidden: s.hidden, mine: s.author_key === me,
    votes: (votes ?? []).filter((v) => v.suggestion_id === s.id).length, voted: (votes ?? []).some((v) => v.suggestion_id === s.id && v.user_id === u.id),
  })).sort((a, b) => b.votes - a.votes);
  return NextResponse.json({ items: out });
}
const op = z.discriminatedUnion("op", [
  z.object({ op: z.literal("create"), title: z.string().trim().min(3).max(120), description: z.string().trim().min(3).max(1000) }),
  z.object({ op: z.literal("vote"), id: z.string().uuid(), on: z.boolean() }),
  z.object({ op: z.literal("report"), id: z.string().uuid() }),
  z.object({ op: z.literal("hide-author"), id: z.string().uuid() }),
]);
export async function POST(req: Request) {
  const u = await requireUser(); if (!u) return err("Sem sessão.", 401);
  const p = op.safeParse(await req.json().catch(() => null)); if (!p.success) return err("Pedido inválido.");
  const sb = adminClient(), d = p.data;
  if (d.op === "create") { await sb.from("suggestions").insert({ author: u.id, author_key: hmac("author:" + u.id), title: d.title, description: d.description }); return NextResponse.json({ ok: true }); }
  const { data: s } = await sb.from("suggestions").select("id,author_key,status,hidden").eq("id", d.id).maybeSingle();
  if (!s || s.status !== "approved" || s.hidden) return err("Sugestão indisponível.", 404);
  if (d.op === "vote") {
    if (d.on) await sb.from("suggestion_votes").upsert({ suggestion_id: d.id, user_id: u.id }); else await sb.from("suggestion_votes").delete().eq("suggestion_id", d.id).eq("user_id", u.id);
  } else if (d.op === "report") {
    await sb.from("suggestion_reports").upsert({ suggestion_id: d.id, user_id: u.id });
    const { count } = await sb.from("suggestion_reports").select("*", { count: "exact", head: true }).eq("suggestion_id", d.id);
    if ((count ?? 0) >= 3) await sb.from("suggestions").update({ hidden: true }).eq("id", d.id); // 3 denúncias de pessoas diferentes escondem até revisão
  } else if (s.author_key !== hmac("author:" + u.id)) await sb.from("suggestion_hidden_authors").upsert({ user_id: u.id, author_key: s.author_key });
  return NextResponse.json({ ok: true });
}
