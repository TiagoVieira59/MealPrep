import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/server";
import { err, requireUser } from "@/lib/server/auth";

export async function POST(req: Request) {
  const u = await requireUser(); if (!u) return err("Sem sessão.", 401);
  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  const c = (code ?? "").trim().toUpperCase();
  if (c.length < 3 || c.length > 30) return err("Código inválido.");
  const sb = adminClient(), since = new Date(Date.now() - 864e5).toISOString();
  await sb.from("creator_attempts").delete().lt("created_at", new Date(Date.now() - 30 * 864e5).toISOString());
  const { count } = await sb.from("creator_attempts").select("*", { count: "exact", head: true }).eq("user_id", u.id).gte("created_at", since);
  if ((count ?? 0) >= 5) return err("Demasiadas tentativas. Tenta amanhã.", 429);
  const { data: used } = await sb.from("creator_redemptions").select("user_id").eq("user_id", u.id).maybeSingle();
  if (used) return err("Já registaste um código nesta conta.", 409);
  const { data: row } = await sb.from("creator_codes").select("id").eq("code", c).eq("active", true).maybeSingle();
  await sb.from("creator_attempts").insert({ user_id: u.id, ok: !!row });
  if (!row) return err("Código não encontrado.", 404);
  await sb.from("creator_redemptions").insert({ user_id: u.id, code_id: row.id });
  return NextResponse.json({ ok: true });
}
